import { describe, it, expect } from "vitest";
import { runDiagnostics } from "../diagnostics";
import { assessDataQuality } from "../flightLog";
import type { FlightLog } from "../flightLog";
import type { AxisStats } from "../blackboxAnalyzer";

const CALM_AXIS: AxisStats = { rmsTrackingError: 2, jitter: 1, spectrum: null, stepResponse: null };

function makeLog(overrides: Partial<FlightLog> = {}): FlightLog {
  return {
    source: "csv",
    sampleCount: 10000,
    analyzedSampleCount: 10000,
    durationSeconds: 30,
    detectedColumns: [],
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
    gyro: { roll: CALM_AXIS, pitch: CALM_AXIS, yaw: CALM_AXIS },
    motor: { saturationPercent: 2, columnsFound: 4 },
    battery: { min: 15.8, max: 16.6, avg: 16.2, sagPercent: 5 },
    throttleNoise: null,
    channels: { metadata: false, gyro: true, motor: true, battery: true, throttleCorrelation: false },
    ...overrides,
  };
}

describe("runDiagnostics", () => {
  it("returns a single no-gyro-data observation when gyro is missing", () => {
    const log = makeLog({ gyro: null, channels: { metadata: false, gyro: false, motor: false, battery: false, throttleCorrelation: false } });
    const observations = runDiagnostics(log, assessDataQuality(log));
    expect(observations).toHaveLength(1);
    expect(observations[0].id).toBe("no-gyro-data");
    expect(observations[0].confidence).toBe("high");
  });

  it("falls back to no-notable-findings for calm, unremarkable data", () => {
    const log = makeLog();
    const observations = runDiagnostics(log, assessDataQuality(log));
    expect(observations.map((o) => o.id)).toEqual(["no-notable-findings"]);
  });

  it("flags high jitter-to-tracking-error ratio with hedged language", () => {
    const jittery: AxisStats = { rmsTrackingError: 4, jitter: 10, spectrum: null, stepResponse: null };
    const log = makeLog({ gyro: { roll: jittery, pitch: CALM_AXIS, yaw: CALM_AXIS } });
    const observations = runDiagnostics(log, assessDataQuality(log));
    const found = observations.find((o) => o.id === "roll-jitter-high");
    expect(found).toBeDefined();
    expect(found!.possibleCause).toMatch(/Possible indication/);
  });

  it("flags slow tracking response separately from jitter", () => {
    const slow: AxisStats = { rmsTrackingError: 12, jitter: 2, spectrum: null, stepResponse: null };
    const log = makeLog({ gyro: { roll: slow, pitch: CALM_AXIS, yaw: CALM_AXIS } });
    const observations = runDiagnostics(log, assessDataQuality(log));
    expect(observations.some((o) => o.id === "roll-tracking-slow")).toBe(true);
  });

  it("flags high motor saturation", () => {
    const log = makeLog({ motor: { saturationPercent: 22, columnsFound: 4 } });
    const observations = runDiagnostics(log, assessDataQuality(log));
    const found = observations.find((o) => o.id === "motor-saturation-high");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("warning");
  });

  it("flags high battery sag", () => {
    const log = makeLog({ battery: { min: 13.5, max: 16.6, avg: 15, sagPercent: 18.7 } });
    const observations = runDiagnostics(log, assessDataQuality(log));
    expect(observations.some((o) => o.id === "battery-sag-high")).toBe(true);
  });

  it("flags likely prop wash from throttle correlation", () => {
    const log = makeLog({
      throttleNoise: {
        bins: [
          { label: "0-25%", rangeLowPercent: 0, rangeHighPercent: 25, rmsGyroMagnitude: 5, sampleCount: 50 },
          { label: "25-50%", rangeLowPercent: 25, rangeHighPercent: 50, rmsGyroMagnitude: 20, sampleCount: 50 },
          { label: "50-75%", rangeLowPercent: 50, rangeHighPercent: 75, rmsGyroMagnitude: 6, sampleCount: 50 },
          { label: "75-100%", rangeLowPercent: 75, rangeHighPercent: 100, rmsGyroMagnitude: 5, sampleCount: 50 },
        ],
        peakBinIndex: 1,
        propWashLikely: true,
      },
    });
    const observations = runDiagnostics(log, assessDataQuality(log));
    expect(observations.some((o) => o.id === "prop-wash-likely")).toBe(true);
  });

  it("lowers confidence to low for step-response overshoot backed by very few steps", () => {
    const shakyStepAxis: AxisStats = {
      rmsTrackingError: 3,
      jitter: 1,
      spectrum: null,
      stepResponse: {
        stepCount: 3,
        usableStepCount: 3,
        riseTimeMs: 40,
        overshootPercent: 25,
        settlingTimeMs: 80,
        settledStepCount: 3,
        averagedCurve: null,
      },
    };
    const log = makeLog({ gyro: { roll: shakyStepAxis, pitch: CALM_AXIS, yaw: CALM_AXIS } });
    const observations = runDiagnostics(log, assessDataQuality(log));
    const found = observations.find((o) => o.id === "roll-step-overshoot");
    expect(found?.confidence).toBe("low");
  });

  it("surfaces a data-quality observation when quality is limited or insufficient", () => {
    const log = makeLog({ durationSeconds: 1 });
    const observations = runDiagnostics(log, assessDataQuality(log));
    expect(observations.some((o) => o.id === "limited-data-quality")).toBe(true);
  });
});
