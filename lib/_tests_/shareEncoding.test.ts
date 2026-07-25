import { describe, it, expect } from "vitest";
import { encodeSharedPreset, decodeSharedPreset } from "../shareEncoding";

describe("encodeSharedPreset / decodeSharedPreset", () => {
  it("round-trips a plain ASCII payload", () => {
    const payload = { name: "Freestyle 5in", cliSnippet: "set p_pitch = 45\nsave", style: "freestyle" };
    const decoded = decodeSharedPreset(encodeSharedPreset(payload));
    expect(decoded).toEqual(payload);
  });

  it("round-trips Thai text correctly", () => {
    const payload = { name: 'Freestyle 5" ทดสอบภาษาไทย', cliSnippet: "set p_pitch = 45\nsave", style: "freestyle" };
    const decoded = decodeSharedPreset(encodeSharedPreset(payload));
    expect(decoded).toEqual(payload);
  });

  it("produces a URL-safe string with no +, /, or = characters", () => {
    const encoded = encodeSharedPreset({ name: "test/+=", cliSnippet: "set x = 1", style: "freestyle" });
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it("returns null for garbage input instead of throwing", () => {
    expect(decodeSharedPreset("not-valid-base64!!!")).toBeNull();
  });

  it("returns null when the decoded JSON is missing required fields", () => {
    const badPayload = Buffer.from(JSON.stringify({ name: "only a name" })).toString("base64url");
    expect(decodeSharedPreset(badPayload)).toBeNull();
  });
});
