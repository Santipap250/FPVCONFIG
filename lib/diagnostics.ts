// Diagnostic layer — reads a FlightLog + its DataQualityAssessment and
// produces a list of Observations. This is explicitly *guidance*, not an
// autonomous tuning authority: every observation states what was actually
// measured, hedges the possible cause, and carries a confidence level tied
// to real data quality (sample size / duration / which channels existed) —
// never a made-up score. No observation here invents a PID value; that
// stays derivePidSuggestion's job in lib/blackboxAnalyzer.ts, which this
// module doesn't replace or duplicate.

import { categorizeNoiseBand, noiseBandLabel } from "./blackboxAnalyzer";
import type { FlightLog } from "./flightLog";
import type { DataQualityAssessment } from "./flightLog";

export type ObservationCategory =
  | "tracking"
  | "noise"
  | "motor"
  | "battery"
  | "throttle-correlation"
  | "step-response"
  | "data-quality";

export type ObservationSeverity = "info" | "notice" | "warning";
export type ObservationConfidence = "low" | "medium" | "high";

export interface Observation {
  id: string;
  axis?: "roll" | "pitch" | "yaw";
  category: ObservationCategory;
  severity: ObservationSeverity;
  /** What was actually measured — a factual statement, not an interpretation. */
  observation: string;
  /** Hedged possible explanation. Null when there genuinely isn't one worth stating. */
  possibleCause: string | null;
  confidence: ObservationConfidence;
}

const AXES = ["roll", "pitch", "yaw"] as const;
const AXIS_LABEL_TH: Record<(typeof AXES)[number], string> = { roll: "Roll", pitch: "Pitch", yaw: "Yaw" };

function baseConfidence(quality: DataQualityAssessment): ObservationConfidence {
  if (quality.level === "excellent") return "high";
  if (quality.level === "good") return "medium";
  return "low";
}

export function runDiagnostics(log: FlightLog, quality: DataQualityAssessment): Observation[] {
  const observations: Observation[] = [];
  const confidence = baseConfidence(quality);

  if (!log.gyro) {
    observations.push({
      id: "no-gyro-data",
      category: "data-quality",
      severity: "warning",
      observation: "ไม่มีข้อมูล gyro ในล็อกนี้",
      possibleCause: "ต้องการไฟล์ CSV ที่ decode แล้วและมีคอลัมน์ gyroADC[] เพื่อวิเคราะห์ต่อ",
      confidence: "high", // this one is a direct fact, not an inference
    });
    return observations;
  }

  if (quality.level === "insufficient" || quality.level === "limited") {
    observations.push({
      id: "limited-data-quality",
      category: "data-quality",
      severity: quality.level === "insufficient" ? "warning" : "notice",
      observation: `คุณภาพข้อมูลของล็อกนี้: ${quality.level}`,
      possibleCause: quality.reasons.join(" · "),
      confidence: "high",
    });
  }

  for (const axis of AXES) {
    const stats = log.gyro[axis];

    if (stats.rmsTrackingError !== null && stats.jitter !== null) {
      const ratio = stats.jitter / Math.max(stats.rmsTrackingError, 0.5);
      if (ratio > 1.6) {
        observations.push({
          id: `${axis}-jitter-high`,
          axis,
          category: "tracking",
          severity: "notice",
          observation: `${AXIS_LABEL_TH[axis]}: jitter (${stats.jitter.toFixed(2)}°/s) สูงเทียบกับ tracking error (${stats.rmsTrackingError.toFixed(1)}°/s)`,
          possibleCause: "Possible indication ว่า D-term สูงไปหรือ filter ไม่พอ — needs verification ด้วยการลอง D ลงทีละน้อย",
          confidence,
        });
      } else if (ratio < 0.5 && stats.rmsTrackingError > 5) {
        observations.push({
          id: `${axis}-tracking-slow`,
          axis,
          category: "tracking",
          severity: "notice",
          observation: `${AXIS_LABEL_TH[axis]}: tracking error สูง (${stats.rmsTrackingError.toFixed(1)}°/s) แต่ jitter ต่ำ`,
          possibleCause: "Possible indication ว่าตอบสนองช้าไป — likely direction คือลอง P ขึ้นทีละน้อย",
          confidence,
        });
      }
    }

    if (stats.spectrum) {
      const band = categorizeNoiseBand(stats.spectrum.peakFrequencyHz);
      if (band !== "unknown") {
        observations.push({
          id: `${axis}-noise-peak`,
          axis,
          category: "noise",
          severity: "info",
          observation: `${AXIS_LABEL_TH[axis]}: noise peak เด่นที่ ${Math.round(stats.spectrum.peakFrequencyHz)} Hz`,
          possibleCause: noiseBandLabel[band],
          confidence,
        });
      }
    }

    if (stats.stepResponse) {
      const sr = stats.stepResponse;
      if (sr.overshootPercent !== null && sr.overshootPercent > 15) {
        observations.push({
          id: `${axis}-step-overshoot`,
          axis,
          category: "step-response",
          severity: "notice",
          observation: `${AXIS_LABEL_TH[axis]}: step response overshoot ${sr.overshootPercent.toFixed(1)}% (จาก ${sr.usableStepCount} step ที่วัดได้)`,
          possibleCause: "Possible indication ว่า P หรือ D อาจสูงไปเล็กน้อย — needs verification, ไม่ใช่ข้อสรุปที่แน่นอนจาก step เพียงไม่กี่ครั้ง",
          confidence: sr.usableStepCount >= 8 ? confidence : "low",
        });
      }
    }
  }

  if (log.motor && log.motor.saturationPercent !== null && log.motor.saturationPercent > 15) {
    observations.push({
      id: "motor-saturation-high",
      category: "motor",
      severity: "warning",
      observation: `Motor saturation ${log.motor.saturationPercent.toFixed(1)}% ของเวลาบิน`,
      possibleCause: "Possible indication ว่ามอเตอร์/ใบพัดใกล้ขีดจำกัดแรงขับบ่อย — likely direction คือเช็ค power-to-weight หรือลด headroom ที่ต้องการจาก PID",
      confidence,
    });
  }

  if (log.battery && log.battery.sagPercent > 15) {
    observations.push({
      id: "battery-sag-high",
      category: "battery",
      severity: "notice",
      observation: `แรงดันแบตตกจาก ${log.battery.max.toFixed(2)}V เหลือ ${log.battery.min.toFixed(2)}V (${log.battery.sagPercent.toFixed(1)}% sag)`,
      possibleCause: "Possible indication ว่าแบตใกล้หมดอายุหรือโหลดสูงเกินความจุ — sag มากอาจทำให้ PID response ไม่คงที่ตลอดเที่ยวบิน",
      confidence,
    });
  }

  const throttleNoise = log.throttleNoise;
  if (throttleNoise?.propWashLikely && throttleNoise.peakBinIndex !== null) {
    observations.push({
      id: "prop-wash-likely",
      category: "throttle-correlation",
      severity: "notice",
      observation: `Noise สูงเด่นชัดที่ throttle ช่วง ${throttleNoise.bins[throttleNoise.peakBinIndex].label}`,
      possibleCause: "ลักษณะนี้ตรงกับ prop wash ทั่วไป — likely direction คือเช็ค filter หรือปรับ D-term ช่วงกลาง throttle",
      confidence,
    });
  }

  if (observations.length === 0) {
    observations.push({
      id: "no-notable-findings",
      category: "data-quality",
      severity: "info",
      observation: "ไม่พบสัญญาณผิดปกติเด่นชัดจากเมทริกที่คำนวณได้",
      possibleCause: null,
      confidence,
    });
  }

  return observations;
}
