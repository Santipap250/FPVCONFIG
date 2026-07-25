import { describe, it, expect } from "vitest";
import { applyRatesCurve, buildRatesCurve, peakRate } from "../ratesEngine";

describe("applyRatesCurve", () => {
  it("returns 0 at center stick regardless of settings", () => {
    expect(applyRatesCurve(0, { rcRate: 1, superRate: 0.7, expo: 0.3 })).toBe(0);
  });

  it("matches the known value for default freestyle settings at full stick", () => {
    // Verified by hand during development: rcRate 1.0 / superRate 0.7 / expo 0.3
    // gives ~667 deg/s at full stick, a realistic freestyle peak rate.
    const rate = applyRatesCurve(1, { rcRate: 1.0, superRate: 0.7, expo: 0.3 });
    expect(rate).toBeGreaterThan(650);
    expect(rate).toBeLessThan(680);
  });

  it("is monotonically increasing from center to full stick", () => {
    const settings = { rcRate: 1.0, superRate: 0.7, expo: 0.3 };
    const samples = [0, 0.25, 0.5, 0.75, 1].map((s) => applyRatesCurve(s, settings));
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThan(samples[i - 1]);
    }
  });

  it("is symmetric for positive and negative stick", () => {
    const settings = { rcRate: 1.0, superRate: 0.7, expo: 0.3 };
    expect(applyRatesCurve(0.6, settings)).toBeCloseTo(-applyRatesCurve(-0.6, settings), 6);
  });

  it("gives racing-style settings a much higher peak than beginner-style settings", () => {
    const beginner = applyRatesCurve(1, { rcRate: 0.6, superRate: 0.3, expo: 0.55 });
    const racing = applyRatesCurve(1, { rcRate: 1.15, superRate: 0.85, expo: 0.15 });
    expect(racing).toBeGreaterThan(beginner * 5);
  });
});

describe("buildRatesCurve", () => {
  it("produces the requested number of samples spanning -1 to 1", () => {
    const points = buildRatesCurve({ rcRate: 1, superRate: 0.7, expo: 0.3 }, 41);
    expect(points).toHaveLength(41);
    expect(points[0].stick).toBeCloseTo(-1, 6);
    expect(points[points.length - 1].stick).toBeCloseTo(1, 6);
  });
});

describe("peakRate", () => {
  it("matches applyRatesCurve at stick = 1", () => {
    const settings = { rcRate: 1, superRate: 0.7, expo: 0.3 };
    expect(peakRate(settings)).toBe(applyRatesCurve(1, settings));
  });
});
