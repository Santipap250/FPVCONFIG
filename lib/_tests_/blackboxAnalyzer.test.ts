import { describe, it, expect } from "vitest";
import { parseBlackboxCsv, categorizeNoiseBand, computeThrottleNoiseCorrelation, derivePidSuggestion } from "../blackboxAnalyzer";

function buildCsv(rows: string[], header: string): string {
  return [header, ...rows].join("\n");
}

describe("parseBlackboxCsv", () => {
  const header = "loopIteration,time (us),gyroADC[0],setpoint[0],motor[0],vbatLatest (V)";

  it("throws on a file with no data rows", () => {
    expect(() => parseBlackboxCsv(header)).toThrow();
  });

  it("computes duration from the time column", () => {
    const rows = Array.from({ length: 100 }, (_, i) => `${i},${i * 1000},0,0,1500,16.0`);
    const result = parseBlackboxCsv(buildCsv(rows, header));
    expect(result.durationSeconds).toBeCloseTo(0.099, 3);
  });

  it("computes battery sag from min/max vbat", () => {
    const rows = ["0,0,0,0,1500,16.8", "1,1000,0,0,1500,16.0", "2,2000,0,0,1500,16.4"];
    const result = parseBlackboxCsv(buildCsv(rows, header));
    expect(result.battery?.min).toBeCloseTo(16.0, 2);
    expect(result.battery?.max).toBeCloseTo(16.8, 2);
    expect(result.battery?.sagPercent).toBeCloseTo(((16.8 - 16.0) / 16.8) * 100, 1);
  });

  it("detects an injected sine-wave noise frequency via the real end-to-end pipeline", () => {
    const sampleRate = 2000;
    const freq = 120;
    const n = 2048;
    const rows: string[] = [];
    for (let i = 0; i < n; i++) {
      const t = Math.round((i * 1_000_000) / sampleRate);
      const g = 15 * Math.sin((2 * Math.PI * freq * i) / sampleRate);
      rows.push(`${i},${t},${g.toFixed(2)},${g.toFixed(2)},1500,16.5`);
    }
    const result = parseBlackboxCsv(buildCsv(rows, header));
    expect(result.axisStats.roll.spectrum).not.toBeNull();
    expect(Math.abs(result.axisStats.roll.spectrum!.peakFrequencyHz - freq)).toBeLessThan(10);
  });

  it("stride-samples very large files and reports it in warnings", () => {
    const rows = Array.from({ length: 50000 }, (_, i) => `${i},${i * 125},0,0,1500,16.0`);
    const result = parseBlackboxCsv(buildCsv(rows, header));
    expect(result.sampleCount).toBe(50000);
    expect(result.analyzedSampleCount).toBeLessThan(50000);
    expect(result.warnings.some((w) => w.includes("สุ่มตัวอย่าง"))).toBe(true);
  });
});

describe("categorizeNoiseBand", () => {
  it("categorizes below 20Hz as low", () => {
    expect(categorizeNoiseBand(10)).toBe("low");
  });
  it("categorizes 20-150Hz as mid", () => {
    expect(categorizeNoiseBand(80)).toBe("mid");
  });
  it("categorizes above 150Hz as high", () => {
    expect(categorizeNoiseBand(300)).toBe("high");
  });
});

describe("computeThrottleNoiseCorrelation", () => {
  it("flags prop wash when noise peaks specifically in a mid-throttle band", () => {
    const samples: { motorPercent: number; gyroMagnitude: number }[] = [];
    for (let i = 0; i < 200; i++) {
      const motorPercent = 1000 + (i / 200) * 1000;
      const relative = i / 200;
      const isMid = relative > 0.35 && relative < 0.65;
      samples.push({ motorPercent, gyroMagnitude: isMid ? 12 : 1 });
    }
    const result = computeThrottleNoiseCorrelation(samples);
    expect(result).not.toBeNull();
    expect(result!.propWashLikely).toBe(true);
  });

  it("does not flag prop wash when noise scales uniformly with throttle", () => {
    const samples: { motorPercent: number; gyroMagnitude: number }[] = [];
    for (let i = 0; i < 200; i++) {
      const relative = i / 200;
      samples.push({ motorPercent: 1000 + relative * 1000, gyroMagnitude: 1 + relative * 6 });
    }
    const result = computeThrottleNoiseCorrelation(samples);
    expect(result).not.toBeNull();
    expect(result!.propWashLikely).toBe(false);
  });

  it("returns null for too few samples", () => {
    expect(computeThrottleNoiseCorrelation([{ motorPercent: 1500, gyroMagnitude: 1 }])).toBeNull();
  });
});

describe("derivePidSuggestion", () => {
  it("returns null when no axis has usable stats", () => {
    const result = parseBlackboxCsv(
      buildCsv(["0,0,,,1500,16.0"], "loopIteration,time (us),gyroADC[0],setpoint[0],motor[0],vbatLatest (V)")
    );
    expect(derivePidSuggestion(result)).toBeNull();
  });
});
