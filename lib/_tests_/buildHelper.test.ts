import { describe, it, expect } from "vitest";
import { calculateBuild } from "../buildHelper";

describe("calculateBuild", () => {
  it("computes power-to-weight from real electrical values (V x A / mass)", () => {
    // 4S nominal = 14.8V, effective current = min(45, 38) = 38A, 4 motors
    // total power = 14.8 * 38 * 4 = 2249.6W, over 650g = 3.46 W/g
    const result = calculateBuild({ auwGrams: 650, cells: 4, escAmpRating: 45, motorMaxAmp: 38, motorCount: 4 });
    expect(result.nominalVoltage).toBeCloseTo(14.8, 1);
    expect(result.totalPowerWatts).toBeCloseTo(2249.6, 1);
    expect(result.powerToWeight).toBeCloseTo(3.46, 1);
  });

  it("uses the lower of ESC rating and motor max as the effective current (bottleneck)", () => {
    const result = calculateBuild({ auwGrams: 500, cells: 4, escAmpRating: 60, motorMaxAmp: 30, motorCount: 4 });
    expect(result.effectiveCurrentPerMotor).toBe(30);
  });

  it("classifies high power-to-weight as freestyle-ready", () => {
    const result = calculateBuild({ auwGrams: 400, cells: 6, escAmpRating: 60, motorMaxAmp: 60, motorCount: 4 });
    expect(result.powerToWeight).toBeGreaterThanOrEqual(5.5);
    expect(result.powerClass).toBe("freestyle");
  });

  it("classifies low power-to-weight as long-range", () => {
    const result = calculateBuild({ auwGrams: 1200, cells: 4, escAmpRating: 20, motorMaxAmp: 15, motorCount: 4 });
    expect(result.powerToWeight).toBeLessThan(3.5);
    expect(result.powerClass).toBe("long-range");
  });

  it("warns when ESC rating is meaningfully below what the motor needs", () => {
    const result = calculateBuild({ auwGrams: 650, cells: 4, escAmpRating: 20, motorMaxAmp: 40, motorCount: 4 });
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("does not warn when ESC has adequate headroom over the motor", () => {
    const result = calculateBuild({ auwGrams: 650, cells: 4, escAmpRating: 45, motorMaxAmp: 42, motorCount: 4 });
    expect(result.warnings.length).toBe(0);
  });
});
