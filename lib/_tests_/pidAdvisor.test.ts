import { describe, it, expect } from "vitest";
import { calculatePid, applyAdjustment } from "../pidAdvisor";

describe("calculatePid", () => {
  it("gives larger props lower gains than smaller props (same everything else)", () => {
    const small = calculatePid({ propSizeInches: 3, motorKv: 1700, cells: 4, style: "freestyle" });
    const large = calculatePid({ propSizeInches: 7, motorKv: 1700, cells: 4, style: "freestyle" });
    expect(large.roll.p).toBeLessThan(small.roll.p);
    expect(large.roll.d).toBeLessThan(small.roll.d);
  });

  it("reduces D on higher cell counts relative to lower cell counts", () => {
    const low = calculatePid({ propSizeInches: 5, motorKv: 1700, cells: 3, style: "freestyle" });
    const high = calculatePid({ propSizeInches: 5, motorKv: 1700, cells: 6, style: "freestyle" });
    expect(high.roll.d).toBeLessThan(low.roll.d);
  });

  it("orders style aggressiveness: beginner < cinematic < freestyle < racing", () => {
    const input = { propSizeInches: 5, motorKv: 1700, cells: 4 } as const;
    const beginner = calculatePid({ ...input, style: "beginner" });
    const cinematic = calculatePid({ ...input, style: "cinematic" });
    const freestyle = calculatePid({ ...input, style: "freestyle" });
    const racing = calculatePid({ ...input, style: "racing" });

    expect(beginner.roll.p).toBeLessThan(cinematic.roll.p);
    expect(cinematic.roll.p).toBeLessThan(freestyle.roll.p);
    expect(freestyle.roll.p).toBeLessThan(racing.roll.p);
  });

  it("produces a CLI snippet containing every computed gain", () => {
    const result = calculatePid({ propSizeInches: 5, motorKv: 1700, cells: 4, style: "freestyle" });
    expect(result.cliSnippet).toContain(`set p_roll = ${result.roll.p}`);
    expect(result.cliSnippet).toContain(`set d_roll = ${result.roll.d}`);
    expect(result.cliSnippet).toContain("save");
  });

  it("always returns positive gains for reasonable inputs", () => {
    const result = calculatePid({ propSizeInches: 5, motorKv: 1700, cells: 4, style: "freestyle" });
    expect(result.roll.p).toBeGreaterThan(0);
    expect(result.roll.d).toBeGreaterThan(0);
    expect(result.feedforward).toBeGreaterThan(0);
  });
});

describe("applyAdjustment", () => {
  it("reduces D by the requested percentage without changing P", () => {
    const base = calculatePid({ propSizeInches: 5, motorKv: 1700, cells: 4, style: "freestyle" });
    const adjusted = applyAdjustment(base, { dAdjustPercent: -10, label: "test" });
    expect(adjusted.roll.d).toBe(Math.round(base.roll.d * 0.9));
    expect(adjusted.roll.p).toBe(base.roll.p);
  });

  it("increases P by the requested percentage without changing D", () => {
    const base = calculatePid({ propSizeInches: 5, motorKv: 1700, cells: 4, style: "freestyle" });
    const adjusted = applyAdjustment(base, { pAdjustPercent: 10, label: "test" });
    expect(adjusted.roll.p).toBe(Math.round(base.roll.p * 1.1));
    expect(adjusted.roll.d).toBe(base.roll.d);
  });

  it("appends the adjustment label to the reasons list", () => {
    const base = calculatePid({ propSizeInches: 5, motorKv: 1700, cells: 4, style: "freestyle" });
    const adjusted = applyAdjustment(base, { dAdjustPercent: -10, label: "test-label" });
    expect(adjusted.reasons.some((r) => r.includes("test-label"))).toBe(true);
  });
});
