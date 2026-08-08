// Step response analysis from real stick inputs found in the log.
//
// This is NOT the frequency-domain deconvolution method PIDtoolbox uses
// (which estimates an idealized impulse response from arbitrary continuous
// stick input via windowed FFT + regularized division). That's a
// substantially bigger, higher-risk piece of signal processing to get right
// blind, without real sample files to validate against — see
// lib/blackboxHeader.ts's header-only approach to raw .bbl for the same
// reasoning applied elsewhere in this codebase.
//
// What this does instead: scan the log for moments where the pilot actually
// made a sharp, held stick movement (a real "step" input), then measure how
// the gyro actually responded to each one — rise time, overshoot, settling
// time — the same three numbers step-response analysis is normally used
// for. It's simpler and only works when the log contains genuine step-like
// inputs (most freestyle/racing flying does), but every number comes from
// measuring an event that actually happened in the flight, not from
// reconstructing a hypothetical one.

export interface StepResponseMetrics {
  /** Step-like events found in the log, before filtering for a clean window. */
  stepCount: number;
  /** Steps whose response could actually be measured (reached the window without missing data). */
  usableStepCount: number;
  /** Median time to first reach 90% of the step target, across usable steps. */
  riseTimeMs: number | null;
  /** Median overshoot beyond the target, as % of the step size, across steps that overshot. */
  overshootPercent: number | null;
  /** Median time to settle and stay within ±5% of target, across steps that settled within the window. */
  settlingTimeMs: number | null;
  /** How many usable steps actually settled within the analysis window. */
  settledStepCount: number;
  /** Point-wise average of every usable step's normalized response curve (0 = pre-step level, 1 = target), for charting. */
  averagedCurve: { tMs: number; response: number }[] | null;
}

const WINDOW_MS = 300; // how long after a step to watch the response
const STEP_DETECT_MS = 25; // the jump itself must happen within this short a span
const HOLD_MS = 120; // setpoint must stay roughly put for this long after the jump to count as a genuine step, not a fast stick flick
const BASELINE_MS = 15; // window just before the step used as the "pre-step" reference level
const SETTLE_BAND = 0.05; // ±5% of the step size counts as "settled"
const MIN_STEPS_FOR_RESULT = 3; // fewer than this and a median is more noise than signal

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

/**
 * @param time    seconds, monotonically increasing, same length as setpoint/gyro
 * @param setpoint deg/s, pilot's commanded rate
 * @param gyro    deg/s, actual measured rate — same axis, same indices as setpoint
 */
export function analyzeStepResponse(
  time: number[],
  setpoint: number[],
  gyro: number[]
): StepResponseMetrics | null {
  const n = Math.min(time.length, setpoint.length, gyro.length);
  if (n < 10) return null;

  // Assume roughly uniform sampling (true for blackbox logs at a fixed
  // loop rate) — use the median inter-sample gap rather than the mean so a
  // handful of dropped/duplicated-timestamp rows can't skew it.
  const gaps: number[] = [];
  for (let i = 1; i < n; i++) gaps.push(time[i] - time[i - 1]);
  const dt = median(gaps.filter((g) => g > 0));
  if (!dt || dt <= 0) return null;

  const detectSamples = Math.max(1, Math.round(STEP_DETECT_MS / 1000 / dt));
  const holdSamples = Math.max(1, Math.round(HOLD_MS / 1000 / dt));
  const windowSamples = Math.max(1, Math.round(WINDOW_MS / 1000 / dt));
  const baselineSamples = Math.max(1, Math.round(BASELINE_MS / 1000 / dt));

  const spRange = Math.max(...setpoint) - Math.min(...setpoint);
  const minStepSize = Math.max(30, spRange * 0.15); // deg/s — ignore noise-level wiggles

  const riseTimes: number[] = [];
  const overshoots: number[] = [];
  const settlingTimes: number[] = [];
  const curves: number[][] = [];
  let stepCount = 0;
  let usableStepCount = 0;
  let settledStepCount = 0;

  let i = detectSamples;
  while (i < n - windowSamples - holdSamples) {
    const delta = setpoint[i] - setpoint[i - detectSamples];

    if (Math.abs(delta) >= minStepSize) {
      const holdSlice = setpoint.slice(i, i + holdSamples);
      const held = stdDev(holdSlice) < Math.abs(delta) * 0.15;

      if (held) {
        stepCount++;
        const baseline = mean(gyro.slice(Math.max(0, i - baselineSamples), i));
        const target = mean(holdSlice);
        const stepSize = target - baseline;

        if (Math.abs(stepSize) >= minStepSize * 0.5) {
          usableStepCount++;
          const curve = gyro
            .slice(i, i + windowSamples)
            .map((g) => (g - baseline) / stepSize);
          curves.push(curve);

          const riseIdx = curve.findIndex((v) => v >= 0.9);
          if (riseIdx !== -1) riseTimes.push(riseIdx * dt * 1000);

          const peak = Math.max(...curve);
          if (peak > 1) overshoots.push((peak - 1) * 100);

          let lastOutOfBand = -1;
          curve.forEach((v, k) => {
            if (Math.abs(v - 1) > SETTLE_BAND) lastOutOfBand = k;
          });
          if (lastOutOfBand !== curve.length - 1) {
            settledStepCount++;
            settlingTimes.push((lastOutOfBand + 1) * dt * 1000);
          }
        }

        i += windowSamples; // don't re-detect the same event inside its own response window
        continue;
      }
    }
    i++;
  }

  if (usableStepCount < MIN_STEPS_FOR_RESULT) return null;

  const averagedCurve =
    curves.length > 0
      ? Array.from({ length: windowSamples }, (_, k) => ({
          tMs: k * dt * 1000,
          response: mean(curves.map((c) => c[k]).filter((v) => v !== undefined)),
        }))
      : null;

  return {
    stepCount,
    usableStepCount,
    riseTimeMs: median(riseTimes),
    overshootPercent: overshoots.length > 0 ? median(overshoots) : 0,
    settlingTimeMs: median(settlingTimes),
    settledStepCount,
    averagedCurve,
  };
}
