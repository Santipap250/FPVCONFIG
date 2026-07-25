import { describe, it, expect } from "vitest";
import { starterPresets, buildPresetCli } from "../presets";
import { calculatePid } from "../pidAdvisor";

describe("starterPresets", () => {
  it("includes all six flying styles exactly once", () => {
    const styles = starterPresets.map((p) => p.style).sort();
    expect(styles).toEqual(["beginner", "cinematic", "freestyle", "longrange", "micro", "racing"].sort());
  });
});

describe("buildPresetCli", () => {
  it("produces gains identical to calling calculatePid directly with the same inputs", () => {
    const preset = starterPresets.find((p) => p.style === "freestyle")!;
    const directResult = calculatePid({
      propSizeInches: preset.propSizeInches,
      motorKv: preset.motorKv,
      cells: preset.cells,
      style: preset.style,
    });
    const cli = buildPresetCli(preset);
    expect(cli).toContain(`set p_roll = ${directResult.roll.p}`);
    expect(cli).toContain(`set d_roll = ${directResult.roll.d}`);
  });

  it("includes the rates settings from the preset", () => {
    const preset = starterPresets.find((p) => p.style === "racing")!;
    const cli = buildPresetCli(preset);
    expect(cli).toContain(`set rc_rate = ${preset.rcRate}`);
    expect(cli).toContain(`set rc_expo = ${preset.expo}`);
  });

  it("ends with save", () => {
    const cli = buildPresetCli(starterPresets[0]);
    expect(cli.trim().endsWith("save")).toBe(true);
  });
});
