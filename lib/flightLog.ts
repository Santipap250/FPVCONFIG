// Normalized data model — the analysis/diagnostic layers below read only
// this shape, never CSV rows or raw .bbl bytes directly. That's the whole
// point: parsing (lib/blackboxAnalyzer.ts's CSV path, lib/blackboxHeader.ts's
// .bbl-header path) and analysis are two separate layers connected only by
// this type, so a future real .bbl binary decoder just needs to produce a
// FlightLog too — nothing downstream has to change or care where the data
// came from.
//
// What this is NOT: a claim that both input kinds populate every field.
// A raw .bbl today only fills `metadata` (from the ASCII header) — `gyro`,
// `motor`, etc. stay `null`, honestly, because the binary frames aren't
// decoded (see lib/blackboxHeader.ts for why). `channels` records exactly
// which top-level fields are populated so nothing downstream has to guess.

import type { AxisStats, BatteryStats, ThrottleNoiseResult } from "./blackboxAnalyzer";

export type FlightLogSource = "csv" | "bbl-header";

export interface FlightLogMetadata {
  firmwareRevision: string | null;
  board: string | null;
  craftName: string | null;
  loopTimeUs: string | null;
  rollPID: string | null;
  pitchPID: string | null;
  yawPID: string | null;
  rates: string | null;
  gyroLowpassHz: string | null;
  dtermLowpassHz: string | null;
}

const EMPTY_METADATA: FlightLogMetadata = {
  firmwareRevision: null,
  board: null,
  craftName: null,
  loopTimeUs: null,
  rollPID: null,
  pitchPID: null,
  yawPID: null,
  rates: null,
  gyroLowpassHz: null,
  dtermLowpassHz: null,
};

/** Which top-level sections of the model actually have real data behind
 * them for this particular log — the analysis layer and UI both key off
 * this instead of null-checking every field individually. */
export interface FlightLogChannels {
  metadata: boolean;
  gyro: boolean;
  motor: boolean;
  battery: boolean;
  throttleCorrelation: boolean;
}

export interface FlightLog {
  source: FlightLogSource;
  sampleCount: number;
  analyzedSampleCount: number;
  durationSeconds: number | null;
  detectedColumns: string[];
  warnings: string[];
  metadata: FlightLogMetadata;
  gyro: { roll: AxisStats; pitch: AxisStats; yaw: AxisStats } | null;
  motor: { saturationPercent: number | null; columnsFound: number } | null;
  battery: BatteryStats | null;
  throttleNoise: ThrottleNoiseResult | null;
  channels: FlightLogChannels;
}

export type DataQualityLevel = "excellent" | "good" | "limited" | "insufficient";

export interface DataQualityAssessment {
  level: DataQualityLevel;
  /** Plain-language reasons a pilot can read directly — every one traces
   * back to something concrete about this specific log (a channel present
   * or absent, a sample/duration figure), never a generic score. */
  reasons: string[];
}

const MIN_DURATION_FOR_FULL_CONFIDENCE_S = 5;

/**
 * Rates data quality from what channels actually came through, not from a
 * hidden scoring formula — every level change below is tied to a specific,
 * statable reason so `reasons` can always explain the level.
 */
export function assessDataQuality(log: FlightLog): DataQualityAssessment {
  const reasons: string[] = [];

  if (log.source === "bbl-header") {
    return {
      level: "insufficient",
      reasons: [
        "อ่านได้เฉพาะ header ของไฟล์ .bbl ดิบ (firmware/PID/rates/filter) — ยังไม่มีข้อมูล gyro/motor/battery จริงให้วิเคราะห์",
        "ต้องการไฟล์ CSV ที่ decode แล้ว (Blackbox Explorer / blackbox_decode) เพื่อวิเคราะห์เต็มรูปแบบ",
      ],
    };
  }

  if (!log.channels.gyro) {
    reasons.push("ไม่พบข้อมูล gyro — วิเคราะห์ tracking error/noise/step response ไม่ได้เลย");
    return { level: "insufficient", reasons };
  }

  let level: DataQualityLevel = "excellent";

  if (log.durationSeconds === null) {
    reasons.push("ไม่พบคอลัมน์เวลา — คำนวณ duration/sample rate ไม่ได้ ผลบางส่วนอาจไม่แม่นยำ");
    level = "limited";
  } else if (log.durationSeconds < MIN_DURATION_FOR_FULL_CONFIDENCE_S) {
    reasons.push(
      `log สั้นมาก (${log.durationSeconds.toFixed(1)}s) — ผลอาจไม่เสถียรพอสำหรับ noise spectrum/step response`
    );
    level = level === "excellent" ? "good" : level;
  } else {
    reasons.push(`มีข้อมูล gyro ครบ ${log.durationSeconds.toFixed(1)}s — เพียงพอสำหรับ tracking error และ noise spectrum`);
  }

  if (!log.channels.motor) {
    reasons.push("ไม่พบคอลัมน์ motor — ข้าม motor saturation และ throttle/noise correlation");
    level = level === "excellent" ? "good" : level;
  } else {
    reasons.push("มีข้อมูล motor — คำนวณ motor saturation ได้");
  }

  if (!log.channels.battery) {
    reasons.push("ไม่พบคอลัมน์แรงดันแบต — ข้ามการวิเคราะห์ battery sag");
    level = level === "excellent" ? "good" : level;
  }

  if (log.warnings.some((w) => w.includes("สุ่มตัวอย่าง"))) {
    reasons.push("ไฟล์ใหญ่เกินขนาดที่วิเคราะห์ทุกแถว — ใช้การสุ่มตัวอย่าง ผลเป็นค่าประมาณ ไม่ใช่ทุกจุดข้อมูลจริง");
    level = level === "excellent" ? "good" : level;
  }

  return { level, reasons };
}

export const dataQualityLabel: Record<DataQualityLevel, string> = {
  excellent: "Excellent",
  good: "Good",
  limited: "Limited",
  insufficient: "Insufficient",
};

// ---- Adapters: existing parser outputs → FlightLog ------------------------
// Neither of these change what lib/blackboxAnalyzer.ts or lib/blackboxHeader.ts
// actually compute — they just repackage the already-correct results into
// the shared shape the analysis/diagnostic/UI layers key off.

import type { BlackboxResult } from "./blackboxAnalyzer";
import type { BlackboxHeaderInfo } from "./blackboxHeader";

export function flightLogFromCsvResult(result: BlackboxResult): FlightLog {
  const hasGyro = (["roll", "pitch", "yaw"] as const).some((axis) => result.axisStats[axis].jitter !== null);

  return {
    source: "csv",
    sampleCount: result.sampleCount,
    analyzedSampleCount: result.analyzedSampleCount,
    durationSeconds: result.durationSeconds,
    detectedColumns: result.detectedColumns,
    warnings: result.warnings,
    metadata: EMPTY_METADATA, // decoded CSV exports don't carry the H-line header block
    gyro: hasGyro ? result.axisStats : null,
    motor: result.motorColumnsFound > 0 ? { saturationPercent: result.motorSaturationPercent, columnsFound: result.motorColumnsFound } : null,
    battery: result.battery,
    throttleNoise: result.throttleNoise,
    channels: {
      metadata: false,
      gyro: hasGyro,
      motor: result.motorColumnsFound > 0,
      battery: result.battery !== null,
      throttleCorrelation: result.throttleNoise !== null,
    },
  };
}

export function flightLogFromHeaderInfo(header: BlackboxHeaderInfo): FlightLog {
  const metadata: FlightLogMetadata = {
    firmwareRevision: header.summary.firmwareRevision,
    board: header.summary.board,
    craftName: header.summary.craftName,
    loopTimeUs: header.summary.loopTimeUs,
    rollPID: header.summary.rollPID,
    pitchPID: header.summary.pitchPID,
    yawPID: header.summary.yawPID,
    rates: header.summary.rates,
    gyroLowpassHz: header.summary.gyroLowpassHz,
    dtermLowpassHz: header.summary.dtermLowpassHz,
  };

  return {
    source: "bbl-header",
    sampleCount: 0,
    analyzedSampleCount: 0,
    durationSeconds: null,
    detectedColumns: Object.keys(header.raw),
    warnings: [],
    metadata,
    gyro: null, // binary frames not decoded — see lib/blackboxHeader.ts
    motor: null,
    battery: null,
    throttleNoise: null,
    channels: {
      metadata: true,
      gyro: false,
      motor: false,
      battery: false,
      throttleCorrelation: false,
    },
  };
}

// ---- File validation --------------------------------------------------
// Runs before any parsing — untrusted input gets a specific, actionable
// reason for rejection rather than a generic parse failure downstream.

export type FileValidationErrorCode = "empty-file" | "too-large" | "unsupported-extension";

export interface FileValidationError {
  code: FileValidationErrorCode;
  message: string;
}

const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200MB — generous for a multi-minute high-rate log, still bounds worst-case parse time
const ALLOWED_EXTENSIONS = [".csv", ".bbl", ".bfl", ".txt"];

export function validateBlackboxFile(file: File): FileValidationError | null {
  if (file.size === 0) {
    return { code: "empty-file", message: "ไฟล์นี้ว่างเปล่า (0 bytes) — ลองส่งออกไฟล์ log ใหม่อีกครั้ง" };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      code: "too-large",
      message: `ไฟล์ใหญ่เกินไป (${(file.size / 1024 / 1024).toFixed(0)}MB) — รองรับสูงสุด ${MAX_UPLOAD_BYTES / 1024 / 1024}MB ต่อไฟล์ ลองตัด log ให้สั้นลงหรือ export เฉพาะช่วงที่ต้องการวิเคราะห์`,
    };
  }
  const lowerName = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
    return {
      code: "unsupported-extension",
      message: `นามสกุลไฟล์ ".${lowerName.split(".").pop()}" ไม่รองรับ — ใช้ได้แค่ ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }
  return null;
}
