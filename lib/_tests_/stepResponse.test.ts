import { describe, it, expect } from "vitest";
import { analyzeStepResponse } from "../stepResponse";

const DT = 0.001; // 1kHz, typical-ish blackbox loop rate

/**
 * Builds a synthetic log: flat at 0, then N step-and-hold events to a fixed
 * target, each followed by a first-order-lag gyro response
 * gyro(t) = target * (1 - exp(-t/tau)) [+ optional overshoot bump], with a
 * flat gap between events. tau is chosen so the analytical 90%-rise time is
 * known exactly, to check riseTimeMs against real math rather than a
 * hand-picked expected number.
 */
function buildSyntheticStepLog(opts: {
  steps: number;
  target: number;
  tauSeconds: number;
  overshootFraction?: number; // e.g. 0.15 for a 15% overshoot before settling
  windowSamples: number;
  gapSamples: number;
  noiseAmplitude?: number;
}) {
  const { steps, target, tauSeconds, overshootFraction = 0, windowSamples, gapSamples, noiseAmplitude = 0 } = opts;
  const time: number[] = [];
  const setpoint: number[] = [];
  const gyro: number[] = [];

  let t = 0;
  const pushFlat = (count: number, spVal: number, gyVal: number) => {
    for (let k = 0; k < count; k++) {
      time.push(t);
      setpoint.push(spVal);
      gyro.push(gyVal + (Math.random() - 0.5) * noiseAmplitude);
      t += DT;
    }
  };

  pushFlat(gapSamples, 0, 0);
  for (let s = 0; s < steps; s++) {
    for (let k = 0; k < windowSamples; k++) {
      const localT = k * DT;
      let response = target * (1 - Math.exp(-localT / tauSeconds));
      if (overshootFraction > 0) {
        // simple decaying-oscillation bump on top of the lag response
        response += target * overshootFraction * Math.exp(-localT / (tauSeconds * 1.5)) * Math.sin(localT / (tauSeconds * 0.6));
      }
      time.push(t);
      setpoint.push(target);
      gyro.push(response + (Math.random() - 0.5) * noiseAmplitude);
      t += DT;
    }
    pushFlat(gapSamples, 0, 0);
  }

  return { time, setpoint, gyro };
}

describe("analyzeStepResponse", () => {
  it("returns null when there isn't enough log data", () => {
    expect(analyzeStepResponse([0, 0.001], [0, 100], [0, 50])).toBeNull();
  });

  it("returns null when fewer than 3 usable steps are found", () => {
    const { time, setpoint, gyro } = buildSyntheticStepLog({
      steps: 1,
      target: 300,
      tauSeconds: 0.02,
      windowSamples: 300,
      gapSamples: 200,
    });
    expect(analyzeStepResponse(time, setpoint, gyro)).toBeNull();
  });

  it("measures rise time close to the analytical value for a clean first-order response", () => {
    const tau = 0.02; // 20ms
    const analyticalRiseTimeMs = -tau * Math.log(0.1) * 1000; // ~46ms

    const { time, setpoint, gyro } = buildSyntheticStepLog({
      steps: 5,
      target: 300,
      tauSeconds: tau,
      windowSamples: 300,
      gapSamples: 200,
    });

    const result = analyzeStepResponse(time, setpoint, gyro);
    expect(result).not.toBeNull();
    expect(result!.usableStepCount).toBe(5);
    expect(result!.riseTimeMs).not.toBeNull();
    // Discrete 1ms sampling + detection-window smoothing on a step edge
    // introduces a few ms of slack either way — this checks it's measuring
    // the right physical quantity, not exact-to-the-millisecond.
    expect(Math.abs(result!.riseTimeMs! - analyticalRiseTimeMs)).toBeLessThan(8);
  });

  it("detects meaningful overshoot when the synthetic response overshoots", () => {
    const { time, setpoint, gyro } = buildSyntheticStepLog({
      steps: 5,
      target: 300,
      tauSeconds: 0.02,
      overshootFraction: 0.2,
      windowSamples: 300,
      gapSamples: 200,
    });

    const result = analyzeStepResponse(time, setpoint, gyro);
    expect(result).not.toBeNull();
    expect(result!.overshootPercent).not.toBeNull();
    expect(result!.overshootPercent!).toBeGreaterThan(5);
  });

  it("reports near-zero overshoot for a clean non-overshooting response", () => {
    const { time, setpoint, gyro } = buildSyntheticStepLog({
      steps: 5,
      target: 300,
      tauSeconds: 0.02,
      windowSamples: 300,
      gapSamples: 200,
    });

    const result = analyzeStepResponse(time, setpoint, gyro);
    expect(result).not.toBeNull();
    expect(result!.overshootPercent).toBe(0);
  });

  it("produces an averaged curve that approaches 1.0 (the normalized target)", () => {
    const { time, setpoint, gyro } = buildSyntheticStepLog({
      steps: 5,
      target: 300,
      tauSeconds: 0.02,
      windowSamples: 300,
      gapSamples: 200,
    });

    const result = analyzeStepResponse(time, setpoint, gyro);
    expect(result?.averagedCurve).not.toBeNull();
    const last = result!.averagedCurve![result!.averagedCurve!.length - 1];
    expect(last.response).toBeGreaterThan(0.95);
    expect(last.response).toBeLessThan(1.05);
  });

  it("ignores small setpoint wiggles that aren't real step inputs", () => {
    const time: number[] = [];
    const setpoint: number[] = [];
    const gyro: number[] = [];
    let t = 0;
    for (let i = 0; i < 2000; i++) {
      time.push(t);
      const wiggle = Math.sin(i / 5) * 5; // tiny, well under the 30 deg/s floor
      setpoint.push(wiggle);
      gyro.push(wiggle);
      t += DT;
    }
    expect(analyzeStepResponse(time, setpoint, gyro)).toBeNull();
  });
});
