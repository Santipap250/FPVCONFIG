// Raw Betaflight/iNav blackbox logs (.bbl) are a hybrid format: a run of
// plain-ASCII "H <key>:<value>" header lines, followed by binary-encoded
// (predictor + variable-length-integer) log frames. Decoding the binary
// frame stream correctly needs real sample files to validate against
// (frame types, per-field predictors/encodings vary by firmware version) —
// that's tracked separately and NOT done here, so this module makes no
// claim about gyro/motor telemetry from a raw file.
//
// What IS safe to do without any binary decoding: read the ASCII header
// block. It's stable, human-readable, and firmware-agnostic enough to
// parse generically. That alone is genuinely useful — the PID/rates/filter
// values a pilot was flying with at the moment they logged is exactly the
// kind of thing they'd otherwise have to reopen Blackbox Explorer to see.

export interface BlackboxHeaderInfo {
  /** Every "H key:value" line found, key exactly as written in the file. */
  raw: Record<string, string>;
  /** How many header lines were parsed before binary frame data began. */
  headerLineCount: number;
  /**
   * A .bbl can contain multiple flights (one per arm/disarm cycle), each
   * with its own repeated header block. Counted via repeated "Product:"
   * lines, which every header block starts with.
   */
  logCount: number;
  /** Best-effort pulls of the fields pilots most often want to see. Any of
   * these can be null — field names shift across firmware versions, and we
   * don't guess when a field isn't present under a name we recognize. */
  summary: {
    firmwareRevision: string | null;
    board: string | null;
    craftName: string | null;
    loopTimeUs: string | null;
    rollPID: string | null;
    pitchPID: string | null;
    yawPID: string | null;
    rates: string | null;
    gyroLowpassHz: string | null;
    dtermLowpassHz: string | null;
  };
}

export type BlackboxFileKind = "csv" | "raw-header" | "unknown";

/**
 * Distinguishes a decoded CSV export from a raw .bbl (or similar) file,
 * looking only at the first line — cheap, and enough to route to the right
 * parser without ever attempting to interpret binary bytes as numbers.
 */
export function detectBlackboxFileKind(text: string): BlackboxFileKind {
  const firstLine = text.split(/\r?\n/, 1)[0]?.trim() ?? "";
  if (firstLine.startsWith("H ")) return "raw-header";
  if (firstLine.includes(",") && /^[A-Za-z0-9_[\] ().,-]+$/.test(firstLine)) return "csv";
  return "unknown";
}

// Best-effort candidate key names per summary field. Matched
// case-insensitively against the header's own keys, first match wins —
// several of these are known to differ across Betaflight versions.
const FIELD_CANDIDATES: Record<keyof BlackboxHeaderInfo["summary"], string[]> = {
  firmwareRevision: ["Firmware revision"],
  board: ["Board information"],
  craftName: ["Craft name"],
  loopTimeUs: ["looptime"],
  rollPID: ["rollPID"],
  pitchPID: ["pitchPID"],
  yawPID: ["yawPID"],
  rates: ["rates", "rate_limits"],
  gyroLowpassHz: ["gyro_lowpass_hz", "gyro_lpf_hz"],
  dtermLowpassHz: ["dterm_lowpass_hz", "dterm_lpf_hz"],
};

function pickField(raw: Record<string, string>, candidates: string[]): string | null {
  const lowerMap = new Map(Object.keys(raw).map((k) => [k.toLowerCase(), k]));
  for (const candidate of candidates) {
    const actualKey = lowerMap.get(candidate.toLowerCase());
    if (actualKey) return raw[actualKey];
  }
  return null;
}

/**
 * Parses only the ASCII header block of a raw blackbox log. Stops at the
 * first line that isn't a well-formed "H key:value" line — that's where
 * binary frame data starts, and this function never attempts to read past
 * that point.
 */
export function parseBlackboxHeader(text: string): BlackboxHeaderInfo {
  const lines = text.split(/\r?\n/);
  const raw: Record<string, string> = {};
  let headerLineCount = 0;
  let logCount = 0;

  for (const line of lines) {
    if (!line.startsWith("H ")) break; // first non-header line = binary frames begin
    const body = line.slice(2);
    const separatorIndex = body.indexOf(":");
    if (separatorIndex === -1) break; // malformed — treat as end of header block, don't guess

    const key = body.slice(0, separatorIndex).trim();
    const value = body.slice(separatorIndex + 1).trim();
    if (!key) break;

    raw[key] = value;
    headerLineCount++;
    if (key.toLowerCase() === "product") logCount++;
  }

  const summary = Object.fromEntries(
    (Object.keys(FIELD_CANDIDATES) as (keyof BlackboxHeaderInfo["summary"])[]).map((field) => [
      field,
      pickField(raw, FIELD_CANDIDATES[field]),
    ])
  ) as BlackboxHeaderInfo["summary"];

  return { raw, headerLineCount, logCount, summary };
}
