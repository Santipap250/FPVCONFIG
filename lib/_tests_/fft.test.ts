import { describe, it, expect } from "vitest";
import { fftMagnitude, computeSpectrum, nextPowerOfTwo } from "../fft";

describe("fftMagnitude", () => {
  it("detects a single known frequency within one bin's resolution", () => {
    const n = 1024;
    const sampleRate = 1000;
    const freq = 80;
    const signal = Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * freq * i) / sampleRate));

    const mag = fftMagnitude(signal);
    let peakIdx = 1;
    for (let i = 2; i < mag.length; i++) if (mag[i] > mag[peakIdx]) peakIdx = i;
    const peakFreq = (peakIdx * sampleRate) / n;

    expect(Math.abs(peakFreq - freq)).toBeLessThan(sampleRate / n);
  });

  it("preserves relative amplitude between two mixed tones", () => {
    const n = 1024;
    const sampleRate = 1000;
    const signal = Array.from(
      { length: n },
      (_, i) => Math.sin((2 * Math.PI * 40 * i) / sampleRate) * 2 + Math.sin((2 * Math.PI * 200 * i) / sampleRate) * 0.5
    );
    const mag = fftMagnitude(signal);
    const bin40 = Math.round((40 * n) / sampleRate);
    const bin200 = Math.round((200 * n) / sampleRate);
    // amplitude ratio should be close to the 2:0.5 = 4x ratio injected
    expect(mag[bin40] / mag[bin200]).toBeGreaterThan(3);
    expect(mag[bin40] / mag[bin200]).toBeLessThan(5.5);
  });

  it("throws on non-power-of-2 length", () => {
    expect(() => fftMagnitude(new Array(100).fill(0))).toThrow();
  });
});

describe("nextPowerOfTwo", () => {
  it("rounds up correctly", () => {
    expect(nextPowerOfTwo(1000)).toBe(1024);
    expect(nextPowerOfTwo(1024)).toBe(1024);
    expect(nextPowerOfTwo(1)).toBe(1);
  });
});

describe("computeSpectrum", () => {
  it("returns null for too-short signals", () => {
    expect(computeSpectrum([1, 2, 3], 1000)).toBeNull();
  });

  it("returns null for zero/negative sample rate", () => {
    expect(computeSpectrum(new Array(100).fill(0), 0)).toBeNull();
  });

  it("finds the injected peak frequency in a realistic-length signal", () => {
    const sampleRate = 2000;
    const freq = 120;
    const n = 4096;
    const signal = Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * freq * i) / sampleRate) * 10);
    const result = computeSpectrum(signal, sampleRate);
    expect(result).not.toBeNull();
    expect(Math.abs(result!.peakFrequencyHz - freq)).toBeLessThan(sampleRate / n + 2);
  });
});
