import { describe, it, expect } from "vitest";
import { detectBlackboxFileKind, parseBlackboxHeader } from "../blackboxHeader";

// A synthetic but format-accurate header block (ASCII "H key:value" lines
// as written by Betaflight's blackbox recorder), followed by a line that
// stands in for the start of binary frame data — real files continue with
// non-ASCII bytes here, this just needs to NOT match "H key:value".
const SAMPLE_HEADER = [
  "H Product:Blackbox flight data recorder by Nicholas Sherlock",
  "H Data version:2",
  "H Firmware type:Cleanflight",
  "H Firmware revision:Betaflight 4.4.0",
  "H Board information:STM32F4 CUSTOM",
  "H Craft name:TestQuad",
  "H looptime:250",
  "H rollPID:45,80,30",
  "H pitchPID:47,84,32",
  "H yawPID:45,80,0",
  "H rates:70,70,70",
  "H gyro_lowpass_hz:100",
  "H dterm_lowpass_hz:75",
  "\x01\x02BINARYFRAMEDATA",
].join("\n");

const SAMPLE_CSV = ['loopIteration,time (us),axisP[0],axisP[1],axisP[2]', "0,1000,1.5,2.5,0.1"].join("\n");

describe("detectBlackboxFileKind", () => {
  it("recognizes a raw .bbl header block", () => {
    expect(detectBlackboxFileKind(SAMPLE_HEADER)).toBe("raw-header");
  });

  it("recognizes a decoded CSV export", () => {
    expect(detectBlackboxFileKind(SAMPLE_CSV)).toBe("csv");
  });

  it("falls back to unknown for unrecognized text", () => {
    expect(detectBlackboxFileKind("not a blackbox file at all")).toBe("unknown");
  });
});

describe("parseBlackboxHeader", () => {
  it("parses every H-prefixed line into the raw map", () => {
    const info = parseBlackboxHeader(SAMPLE_HEADER);
    expect(info.raw["Firmware revision"]).toBe("Betaflight 4.4.0");
    expect(info.raw["Craft name"]).toBe("TestQuad");
    expect(info.headerLineCount).toBe(13);
  });

  it("stops at the first non-header line and never touches binary data", () => {
    const info = parseBlackboxHeader(SAMPLE_HEADER);
    expect(Object.keys(info.raw)).not.toContain("\x01\x02BINARYFRAMEDATA");
  });

  it("pulls known summary fields", () => {
    const info = parseBlackboxHeader(SAMPLE_HEADER);
    expect(info.summary.firmwareRevision).toBe("Betaflight 4.4.0");
    expect(info.summary.rollPID).toBe("45,80,30");
    expect(info.summary.gyroLowpassHz).toBe("100");
  });

  it("counts multiple concatenated flight logs by repeated Product: lines", () => {
    const cleanBlock = SAMPLE_HEADER.split("\n").slice(0, -1).join("\n"); // drop the trailing binary-garbage line
    const twoFlights = `${cleanBlock}\n${SAMPLE_HEADER}`;
    const info = parseBlackboxHeader(twoFlights);
    expect(info.logCount).toBe(2);
  });

  it("returns nulls for summary fields that aren't present, without guessing", () => {
    const minimal = "H Product:Blackbox flight data recorder by Nicholas Sherlock\nH Data version:2";
    const info = parseBlackboxHeader(minimal);
    expect(info.summary.rollPID).toBeNull();
    expect(info.summary.craftName).toBeNull();
  });
});
