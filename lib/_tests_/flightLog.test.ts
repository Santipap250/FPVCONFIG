import { describe, it, expect } from "vitest";
import {
  assessDataQuality,
  validateBlackboxFile,
  flightLogFromCsvResult,
  flightLogFromHeaderInfo,
  type FlightLog,
} from "../flightLog";
import type { AxisStats } from "../blackboxAnalyzer";
import type { BlackboxResult } from "../blackboxAnalyzer";
import type { BlackboxHeaderInfo } from "../blackboxHeader";

const EMPTY_AXIS: AxisStats = { rmsTrackingError: null, jitter: null, spectrum: null, stepResponse: null };
const GOOD_AXIS: AxisStats = {
  rmsTrackingError: 3.2,
  jitter: 1.1,
  spectrum: { frequenciesHz: [0, 10, 20], magnitudes: [0, 1, 0.5], peakFrequencyHz: 10, peakMagnitude: 1 },
  stepResponse: null,
};

function makeFlightLog(overrides: Partial<FlightLog> = {}): FlightLog {
  return {
    source: "csv",
    sampleCount: 10000,
    analyzedSampleCount: 10000,
    durationSeconds: 30,
    detectedColumns: ["time (us)", "gyroADC[0]"],
    warnings: [],
    metadata: {
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
    },
    gyro: { roll: GOOD_AXIS, pitch: GOOD_AXIS, yaw: GOOD_AXIS },
    motor: { saturationPercent: 2, columnsFound: 4 },
    battery: { min: 15.1, max: 16.6, avg: 15.9, sagPercent: 9 },
    throttleNoise: null,
    channels: { metadata: false, gyro: true, motor: true, battery: true, throttleCorrelation: false },
    ...overrides,
  };
}

function makeFile(name: string, sizeBytes: number): File {
  // jsdom/node File doesn't easily let you set .size directly via the
  // constructor content length in this test environment shortcut, so build
  // content of the exact target size instead — keeps this a real File, not
  // a mock object shaped like one.
  const content = new Uint8Array(sizeBytes);
  return new File([content], name);
}

describe("validateBlackboxFile", () => {
  it("rejects an empty file", () => {
    const err = validateBlackboxFile(makeFile("log.csv", 0));
    expect(err?.code).toBe("empty-file");
  });

  it("rejects a file over the size limit", () => {
    const err = validateBlackboxFile(makeFile("log.csv", 201 * 1024 * 1024));
    expect(err?.code).toBe("too-large");
  });

  it("rejects an unsupported extension", () => {
    const err = validateBlackboxFile(makeFile("log.exe", 1024));
    expect(err?.code).toBe("unsupported-extension");
  });

  it("accepts a reasonably sized .csv file", () => {
    expect(validateBlackboxFile(makeFile("log.csv", 1024))).toBeNull();
  });

  it("accepts a .bbl file", () => {
    expect(validateBlackboxFile(makeFile("log.bbl", 1024))).toBeNull();
  });
});

describe("assessDataQuality", () => {
  it("is insufficient for a raw .bbl (header-only) source, regardless of other fields", () => {
    const log = makeFlightLog({ source: "bbl-header", gyro: null, motor: null, battery: null });
    const result = assessDataQuality(log);
    expect(result.level).toBe("insufficient");
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("is insufficient when there's no gyro data at all", () => {
    const log = makeFlightLog({ gyro: null, channels: { metadata: false, gyro: false, motor: true, battery: true, throttleCorrelation: false } });
    expect(assessDataQuality(log).level).toBe("insufficient");
  });

  it("is excellent with gyro + motor + battery + a long enough duration", () => {
    const log = makeFlightLog({ durationSeconds: 60 });
    expect(assessDataQuality(log).level).toBe("excellent");
  });

  it("downgrades to good when motor data is missing", () => {
    const log = makeFlightLog({ durationSeconds: 60, motor: null, channels: { metadata: false, gyro: true, motor: false, battery: true, throttleCorrelation: false } });
    const result = assessDataQuality(log);
    expect(result.level).toBe("good");
    expect(result.reasons.some((r) => r.includes("motor"))).toBe(true);
  });

  it("downgrades when the log is very short", () => {
    const log = makeFlightLog({ durationSeconds: 1.5 });
    expect(assessDataQuality(log).level).not.toBe("excellent");
  });

  it("flags stride-sampled (large file) warnings in the reasons", () => {
    const log = makeFlightLog({ durationSeconds: 60, warnings: ["ไฟล์มี 500,000 แถว — สุ่มตัวอย่างทุก 10 แถว..."] });
    const result = assessDataQuality(log);
    expect(result.reasons.some((r) => r.includes("สุ่มตัวอย่าง"))).toBe(true);
  });
});

describe("flightLogFromCsvResult", () => {
  it("marks gyro channel present only when at least one axis has real stats", () => {
    const result: BlackboxResult = {
      sampleCount: 100,
      analyzedSampleCount: 100,
      durationSeconds: 10,
      axisStats: { roll: GOOD_AXIS, pitch: EMPTY_AXIS, yaw: EMPTY_AXIS },
      motorSaturationPercent: null,
      motorColumnsFound: 0,
      battery: null,
      throttleNoise: null,
      detectedColumns: ["gyroADC[0]"],
      warnings: [],
    };
    const log = flightLogFromCsvResult(result);
    expect(log.channels.gyro).toBe(true);
    expect(log.channels.motor).toBe(false);
    expect(log.channels.battery).toBe(false);
    expect(log.source).toBe("csv");
  });

  it("marks gyro channel absent when every axis is empty", () => {
    const result: BlackboxResult = {
      sampleCount: 0,
      analyzedSampleCount: 0,
      durationSeconds: null,
      axisStats: { roll: EMPTY_AXIS, pitch: EMPTY_AXIS, yaw: EMPTY_AXIS },
      motorSaturationPercent: null,
      motorColumnsFound: 0,
      battery: null,
      throttleNoise: null,
      detectedColumns: [],
      warnings: [],
    };
    expect(flightLogFromCsvResult(result).channels.gyro).toBe(false);
  });
});

describe("flightLogFromHeaderInfo", () => {
  it("populates metadata but leaves telemetry channels false", () => {
    const header: BlackboxHeaderInfo = {
      raw: { "Firmware revision": "Betaflight 4.4.0" },
      headerLineCount: 1,
      logCount: 1,
      summary: {
        firmwareRevision: "Betaflight 4.4.0",
        board: null,
        craftName: null,
        loopTimeUs: null,
        rollPID: null,
        pitchPID: null,
        yawPID: null,
        rates: null,
        gyroLowpassHz: null,
        dtermLowpassHz: null,
      },
    };
    const log = flightLogFromHeaderInfo(header);
    expect(log.source).toBe("bbl-header");
    expect(log.metadata.firmwareRevision).toBe("Betaflight 4.4.0");
    expect(log.channels.metadata).toBe(true);
    expect(log.channels.gyro).toBe(false);
    expect(log.gyro).toBeNull();
  });
});
