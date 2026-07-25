import { computeSpectrum, type SpectrumResult } from "./fft";

export interface AxisStats {
  rmsTrackingError: number | null;
  jitter: number | null;
  spectrum: SpectrumResult | null;
}

export type NoiseBand = "low" | "mid" | "high" | "unknown";

// Rough, widely-cited community bands (not exact science): low-frequency
// content usually tracks frame flex/prop wash, mid-frequency tracks
// motor/prop harmonics at typical FPV RPM, high-frequency is more often
// electrical noise or an under-filtered gyro signal.
export function categorizeNoiseBand(hz: number): NoiseBand {
  if (hz <= 0) return "unknown";
  if (hz < 20) return "low";
  if (hz < 150) return "mid";
  return "high";
}

export const noiseBandLabel: Record<NoiseBand, string> = {
  low: "ความถี่ต่ำ (<20Hz) — มักเกี่ยวกับเฟรมแอ่น/prop wash",
  mid: "ความถี่กลาง (20-150Hz) — มักเกี่ยวกับมอเตอร์/ใบพัด",
  high: "ความถี่สูง (>150Hz) — มักเป็น electrical noise หรือ filter ไม่พอ",
  unknown: "ไม่พบ noise เด่นชัด",
};

export interface BatteryStats {
  min: number;
  max: number;
  avg: number;
  sagPercent: number;
}

export interface BlackboxResult {
  sampleCount: number;
  analyzedSampleCount: number;
  durationSeconds: number | null;
  axisStats: { roll: AxisStats; pitch: AxisStats; yaw: AxisStats };
  motorSaturationPercent: number | null;
  motorColumnsFound: number;
  battery: BatteryStats | null;
  throttleNoise: ThrottleNoiseResult | null;
  detectedColumns: string[];
  warnings: string[];
}

const AXIS_NAMES = ["roll", "pitch", "yaw"] as const;
const MAX_ANALYZED_ROWS = 40000; // stride-sample longer logs to stay responsive on the main thread

function findColumnIndex(headers: string[], name: string): number {
  const trimmed = headers.map((h) => h.trim());
  const exact = trimmed.indexOf(name);
  if (exact !== -1) return exact;
  return trimmed.findIndex((h) => h.startsWith(name));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function rms(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.sqrt(mean(values.map((v) => v * v)));
}

export interface PidSuggestion {
  direction: "lower-d" | "raise-p" | "balanced";
  label: string;
  pAdjustPercent?: number;
  dAdjustPercent?: number;
}

export function derivePidSuggestion(result: BlackboxResult): PidSuggestion | null {
  const axesWithData = (["roll", "pitch", "yaw"] as const)
    .map((axis) => result.axisStats[axis])
    .filter((s) => s.jitter !== null && s.rmsTrackingError !== null);

  if (axesWithData.length === 0) return null;

  const avgRatio = mean(
    axesWithData.map((s) => (s.jitter as number) / Math.max(s.rmsTrackingError as number, 0.5))
  );

  if (avgRatio > 1.6) {
    return {
      direction: "lower-d",
      label: "jitter สูงเทียบกับ tracking error — D อาจสูงไปหรือ filter ไม่พอ ลอง D ลง ~10%",
      dAdjustPercent: -10,
    };
  }

  if (avgRatio < 0.5 && mean(axesWithData.map((s) => s.rmsTrackingError as number)) > 5) {
    return {
      direction: "raise-p",
      label: "tracking error สูงแต่ jitter ต่ำ — ตอบสนองอาจช้าไป ลอง P ขึ้น ~10%",
      pAdjustPercent: 10,
    };
  }

  return {
    direction: "balanced",
    label: "อัตราส่วน jitter ต่อ tracking error อยู่ในเกณฑ์สมดุล ยังไม่มีคำแนะนำปรับพิเศษจาก log นี้",
  };
}

export interface SavedAnalysis {
  id: string;
  fileName: string;
  createdAt: string;
  buildProfileName?: string;
  sampleCount: number;
  durationSeconds: number | null;
  motorSaturationPercent: number | null;
  batterySagPercent: number | null;
  axisSummary: {
    roll: AxisStats;
    pitch: AxisStats;
    yaw: AxisStats;
  };
  noisePeaks?: { axis: "roll" | "pitch" | "yaw"; hz: number; band: NoiseBand }[];
  suggestionLabel?: string;
}

export function buildSavedAnalysis(
  result: BlackboxResult,
  fileName: string,
  buildProfileName: string | undefined,
  suggestionLabel: string | undefined
): SavedAnalysis {
  // Store only the peak frequency + band per axis, not the full spectrum
  // array — this stays a lightweight summary, consistent with the rest of
  // what gets saved here.
  const noisePeaks: SavedAnalysis["noisePeaks"] = (["roll", "pitch", "yaw"] as const)
    .filter((axis) => result.axisStats[axis].spectrum)
    .map((axis) => {
      const spectrum = result.axisStats[axis].spectrum!;
      return { axis, hz: Math.round(spectrum.peakFrequencyHz), band: categorizeNoiseBand(spectrum.peakFrequencyHz) };
    });

  return {
    id: `${Date.now()}`,
    fileName,
    createdAt: new Date().toISOString(),
    buildProfileName,
    sampleCount: result.sampleCount,
    durationSeconds: result.durationSeconds,
    motorSaturationPercent: result.motorSaturationPercent,
    batterySagPercent: result.battery?.sagPercent ?? null,
    axisSummary: {
      roll: { ...result.axisStats.roll, spectrum: null },
      pitch: { ...result.axisStats.pitch, spectrum: null },
      yaw: { ...result.axisStats.yaw, spectrum: null },
    },
    noisePeaks,
    suggestionLabel,
  };
}

export interface ThrottleNoiseBin {
  label: string;
  rangeLowPercent: number;
  rangeHighPercent: number;
  rmsGyroMagnitude: number;
  sampleCount: number;
}

export interface ThrottleNoiseResult {
  bins: ThrottleNoiseBin[];
  peakBinIndex: number | null;
  propWashLikely: boolean;
}

const MIN_SAMPLES_PER_BIN = 20;

/**
 * Bins samples by observed throttle range (relative to this log's own
 * min/max motor output, not an assumed absolute scale — motor value ranges
 * differ by protocol/config) and computes RMS combined-gyro-magnitude per
 * bin. A markedly higher RMS in the mid-throttle bins than at idle/full is
 * the classic signature of prop wash.
 */
export function computeThrottleNoiseCorrelation(
  samples: { motorPercent: number; gyroMagnitude: number }[]
): ThrottleNoiseResult | null {
  if (samples.length < MIN_SAMPLES_PER_BIN * 2) return null;

  const motorValues = samples.map((s) => s.motorPercent);
  const min = Math.min(...motorValues);
  const max = Math.max(...motorValues);
  if (max - min < 1e-6) return null;

  const bandLabels = ["0-25%", "25-50%", "50-75%", "75-100%"];
  const bins: ThrottleNoiseBin[] = bandLabels.map((label, i) => ({
    label,
    rangeLowPercent: i * 25,
    rangeHighPercent: (i + 1) * 25,
    rmsGyroMagnitude: 0,
    sampleCount: 0,
  }));

  const bucketed: number[][] = [[], [], [], []];
  for (const sample of samples) {
    const relative = (sample.motorPercent - min) / (max - min); // 0..1
    const idx = Math.min(3, Math.floor(relative * 4));
    bucketed[idx].push(sample.gyroMagnitude);
  }

  bucketed.forEach((values, i) => {
    bins[i].sampleCount = values.length;
    bins[i].rmsGyroMagnitude = values.length > 0 ? rms(values) : 0;
  });

  const validBins = bins.filter((b) => b.sampleCount >= MIN_SAMPLES_PER_BIN);
  if (validBins.length < 2) return { bins, peakBinIndex: null, propWashLikely: false };

  let peakBinIndex: number | null = null;
  let peakValue = -Infinity;
  bins.forEach((b, i) => {
    if (b.sampleCount >= MIN_SAMPLES_PER_BIN && b.rmsGyroMagnitude > peakValue) {
      peakValue = b.rmsGyroMagnitude;
      peakBinIndex = i;
    }
  });

  // "Prop wash likely" only when the peak sits in a middle throttle band
  // (not idle, not full throttle) and is meaningfully higher than the
  // quietest valid bin — mid-throttle is where prop wash classically shows
  // up, versus noise that simply scales with throttle everywhere.
  const quietest = Math.min(...validBins.map((b) => b.rmsGyroMagnitude));
  const propWashLikely =
    peakBinIndex !== null &&
    (peakBinIndex === 1 || peakBinIndex === 2) &&
    quietest > 0 &&
    peakValue / quietest > 1.4;

  return { bins, peakBinIndex, propWashLikely };
}

export function parseBlackboxCsv(text: string): BlackboxResult {
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    throw new Error("ไฟล์นี้ไม่มีข้อมูลพอให้วิเคราะห์ (ต้องมี header + อย่างน้อย 1 แถวข้อมูล)");
  }

  const headers = lines[0].split(",");
  const detectedColumns = headers.map((h) => h.trim());
  const dataLines = lines.slice(1);
  const sampleCount = dataLines.length;

  // Stride-sample very large logs instead of parsing every row, so the
  // browser tab doesn't lock up on multi-minute high-rate logs.
  let stride = 1;
  if (sampleCount > MAX_ANALYZED_ROWS) {
    stride = Math.ceil(sampleCount / MAX_ANALYZED_ROWS);
    warnings.push(
      `ไฟล์มี ${sampleCount.toLocaleString()} แถว — สุ่มตัวอย่างทุก ${stride} แถวเพื่อให้วิเคราะห์ได้เร็วในเบราว์เซอร์ (ผลลัพธ์เป็นค่าประมาณจาก sample)`
    );
  }

  const timeIdx = findColumnIndex(headers, "time (us)");
  const gyroIdx = AXIS_NAMES.map((_, i) => findColumnIndex(headers, `gyroADC[${i}]`));
  const setpointIdx = AXIS_NAMES.map((_, i) => findColumnIndex(headers, `setpoint[${i}]`));
  const vbatIdx = findColumnIndex(headers, "vbatLatest (V)");

  const motorIdxs: number[] = [];
  for (let i = 0; i < 8; i++) {
    const idx = findColumnIndex(headers, `motor[${i}]`);
    if (idx !== -1) motorIdxs.push(idx);
  }

  if (gyroIdx.every((i) => i === -1)) {
    warnings.push("ไม่พบคอลัมน์ gyroADC[] ในไฟล์ — ข้ามการคำนวณ tracking error/jitter");
  }
  if (motorIdxs.length === 0) {
    warnings.push("ไม่พบคอลัมน์ motor[] ในไฟล์ — ข้ามการคำนวณ motor saturation");
  }
  if (vbatIdx === -1) {
    warnings.push("ไม่พบคอลัมน์ vbatLatest (V) ในไฟล์ — ข้ามการคำนวณแรงดันแบต");
  }

  const gyroSeries: number[][] = [[], [], []];
  const errorSeries: number[][] = [[], [], []];
  const motorSeries: number[][] = motorIdxs.map(() => []);
  const vbatSeries: number[] = [];
  // Synchronized same-row pairs (motor throttle level, combined gyro
  // magnitude) — used for prop-wash-style throttle/noise correlation.
  // Built from the same row iteration as everything else so it can't drift
  // out of alignment the way two independently-filtered arrays could.
  const throttleNoiseSamples: { motorPercent: number; gyroMagnitude: number }[] = [];
  let firstTime: number | null = null;
  let lastTime: number | null = null;

  for (let row = 0; row < dataLines.length; row += stride) {
    const cells = dataLines[row].split(",");

    if (timeIdx !== -1) {
      const t = Number(cells[timeIdx]);
      if (Number.isFinite(t)) {
        if (firstTime === null) firstTime = t;
        lastTime = t;
      }
    }

    const rowGyro: (number | null)[] = [null, null, null];

    for (let axis = 0; axis < 3; axis++) {
      const gIdx = gyroIdx[axis];
      const sIdx = setpointIdx[axis];
      if (gIdx === -1) continue;
      const g = Number(cells[gIdx]);
      if (!Number.isFinite(g)) continue;
      gyroSeries[axis].push(g);
      rowGyro[axis] = g;
      if (sIdx !== -1) {
        const s = Number(cells[sIdx]);
        if (Number.isFinite(s)) errorSeries[axis].push(s - g);
      }
    }

    const rowMotorValues: number[] = [];
    motorIdxs.forEach((idx, mi) => {
      const v = Number(cells[idx]);
      if (Number.isFinite(v)) {
        motorSeries[mi].push(v);
        rowMotorValues.push(v);
      }
    });

    if (rowMotorValues.length > 0 && rowGyro.every((v) => v !== null)) {
      const motorAvg = mean(rowMotorValues);
      const gyroMagnitude = Math.sqrt(
        (rowGyro[0] as number) ** 2 + (rowGyro[1] as number) ** 2 + (rowGyro[2] as number) ** 2
      );
      throttleNoiseSamples.push({ motorPercent: motorAvg, gyroMagnitude });
    }

    if (vbatIdx !== -1) {
      const v = Number(cells[vbatIdx]);
      if (Number.isFinite(v) && v > 0) vbatSeries.push(v);
    }
  }

  const durationSeconds =
    firstTime !== null && lastTime !== null ? (lastTime - firstTime) / 1_000_000 : null;

  // Effective sample rate of the *analyzed* series — must account for
  // stride-sampling, or frequency labels on the spectrum would be wrong.
  const effectiveSampleRateHz =
    durationSeconds && durationSeconds > 0 && gyroSeries[0].length > 1
      ? (gyroSeries[0].length - 1) / durationSeconds
      : null;

  const axisStats = {
    roll: computeAxisStats(gyroSeries[0], errorSeries[0], effectiveSampleRateHz),
    pitch: computeAxisStats(gyroSeries[1], errorSeries[1], effectiveSampleRateHz),
    yaw: computeAxisStats(gyroSeries[2], errorSeries[2], effectiveSampleRateHz),
  };

  let motorSaturationPercent: number | null = null;
  if (motorSeries.length > 0 && motorSeries[0].length > 0) {
    let flagged = 0;
    let total = 0;
    motorSeries.forEach((series) => {
      const maxObserved = Math.max(...series);
      series.forEach((v) => {
        total++;
        if (v >= maxObserved * 0.98) flagged++;
      });
    });
    motorSaturationPercent = total > 0 ? (flagged / total) * 100 : null;
  }

  let battery: BatteryStats | null = null;
  if (vbatSeries.length > 0) {
    const min = Math.min(...vbatSeries);
    const max = Math.max(...vbatSeries);
    battery = {
      min,
      max,
      avg: mean(vbatSeries),
      sagPercent: max > 0 ? ((max - min) / max) * 100 : 0,
    };
  }

  const throttleNoise = computeThrottleNoiseCorrelation(throttleNoiseSamples);

  return {
    sampleCount,
    analyzedSampleCount: gyroSeries[0].length || Math.ceil(sampleCount / stride),
    durationSeconds,
    axisStats,
    motorSaturationPercent,
    motorColumnsFound: motorIdxs.length,
    battery,
    throttleNoise,
    detectedColumns,
    warnings,
  };
}

function computeAxisStats(gyro: number[], error: number[], sampleRateHz: number | null): AxisStats {
  if (gyro.length < 2) return { rmsTrackingError: null, jitter: null, spectrum: null };
  const diffs: number[] = [];
  for (let i = 1; i < gyro.length; i++) diffs.push(Math.abs(gyro[i] - gyro[i - 1]));

  // Remove DC/mean offset before the FFT — a constant gyro bias would
  // otherwise dominate the DC bin and isn't "noise".
  const meanGyro = mean(gyro);
  const centered = gyro.map((v) => v - meanGyro);
  const spectrum = sampleRateHz ? computeSpectrum(centered, sampleRateHz) : null;

  return {
    rmsTrackingError: error.length > 0 ? rms(error) : null,
    jitter: mean(diffs),
    spectrum,
  };
}
