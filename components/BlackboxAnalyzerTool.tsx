"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  parseBlackboxCsv,
  derivePidSuggestion,
  buildSavedAnalysis,
  categorizeNoiseBand,
  noiseBandLabel,
  type BlackboxResult,
  type SavedAnalysis,
} from "@/lib/blackboxAnalyzer";
import {
  detectBlackboxFileKind,
  parseBlackboxHeader,
  type BlackboxHeaderInfo,
} from "@/lib/blackboxHeader";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useBuildProfiles } from "@/lib/useBuildProfiles";
import ActiveBuildBanner from "./ActiveBuildBanner";

const STORAGE_KEY = "saved-blackbox-analyses-v1";

const AXIS_LABELS = { roll: "Roll", pitch: "Pitch", yaw: "Yaw" } as const;

function spectrumToPath(magnitudes: number[]): string {
  if (magnitudes.length === 0) return "";
  // Skip the DC bin (index 0) — a constant offset isn't noise and would
  // otherwise dwarf everything else on the chart.
  const usable = magnitudes.slice(1);
  const max = Math.max(...usable, 1e-6);
  return usable
    .map((m, i) => {
      const x = (i / (usable.length - 1)) * 200;
      const y = 60 - (m / max) * 58;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function BlackboxAnalyzerTool() {
  const { activeProfile } = useBuildProfiles();
  const [result, setResult] = useState<BlackboxResult | null>(null);
  const [headerInfo, setHeaderInfo] = useState<BlackboxHeaderInfo | null>(null);
  const [showRawHeader, setShowRawHeader] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useLocalStorage<SavedAnalysis[]>(STORAGE_KEY, []);
  const [savedNotice, setSavedNotice] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestion = useMemo(() => (result ? derivePidSuggestion(result) : null), [result]);

  const handleSaveAnalysis = () => {
    if (!result || !fileName) return;
    const entry = buildSavedAnalysis(result, fileName, activeProfile?.name, suggestion?.label);
    setSavedAnalyses([entry, ...savedAnalyses].slice(0, 10));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleDeleteAnalysis = (id: string) => setSavedAnalyses(savedAnalyses.filter((a) => a.id !== id));

  const handleFile = useCallback((file: File) => {
    setError(null);
    setResult(null);
    setHeaderInfo(null);
    setShowRawHeader(false);
    setFileName(file.name);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const kind = detectBlackboxFileKind(text);

        if (kind === "raw-header") {
          // Raw .bbl: header block only (firmware/PIDs/rates/filters as
          // logged), not the binary gyro/motor frames — see lib/blackboxHeader.ts
          // for why the frame data itself isn't decoded here.
          setHeaderInfo(parseBlackboxHeader(text));
        } else if (kind === "csv") {
          setResult(parseBlackboxCsv(text));
        } else {
          throw new Error(
            "อ่านไฟล์นี้ไม่ออก — รองรับ CSV ที่ decode แล้วจาก Blackbox Explorer/blackbox_decode (วิเคราะห์เต็มรูปแบบ) หรือไฟล์ .bbl ดิบ (อ่านได้เฉพาะ header: firmware/PID/rates/filter)"
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "อ่านไฟล์ไม่สำเร็จ");
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError("อ่านไฟล์ไม่สำเร็จ");
      setIsLoading(false);
    };
    reader.readAsText(file);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="mt-10">
      <ActiveBuildBanner />
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="rounded-2xl border border-dashed border-line-strong bg-bg-panel/70 p-8 text-center"
      >
        <p className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">
          ลากไฟล์มาวาง หรือเลือกไฟล์
        </p>
        <p className="font-display mt-2 text-lg text-ink">อัปโหลด Blackbox log</p>
        <p className="mt-2 text-sm text-muted">
          ไฟล์ .csv ที่ decode แล้ว (จาก Blackbox Explorer หรือ blackbox_decode) จะได้กราฟ noise/tracking
          error เต็มรูปแบบ · ไฟล์ .bbl ดิบตอนนี้อ่านได้เฉพาะ header (firmware, PID, rates, filter ที่ log ไว้) —
          ยังไม่ decode กราฟจากเฟรมข้อมูลไบนารี
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="font-hud mt-4 rounded-md border border-line-strong px-5 py-2.5 text-xs uppercase tracking-[0.15em] text-phosphor hover:bg-phosphor hover:text-[#04140b]"
        >
          เลือกไฟล์
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.bbl,.bfl,text/csv"
          onChange={onInputChange}
          className="hidden"
          aria-label="เลือกไฟล์ .csv หรือ .bbl สำหรับวิเคราะห์ Blackbox"
        />
        {fileName && <p className="font-hud mt-3 text-xs text-muted">ไฟล์: {fileName}</p>}
        <p className="mt-4 text-xs text-muted">
          ไฟล์ถูกวิเคราะห์ในเบราว์เซอร์ของคุณเท่านั้น ไม่มีการอัปโหลดขึ้น server
        </p>
      </div>

      {isLoading && <p className="mt-6 font-hud text-sm text-phosphor-dim">กำลังวิเคราะห์...</p>}

      {error && (
        <div className="mt-6 rounded-xl border border-danger/40 bg-danger/5 px-5 py-4 text-sm text-danger">
          {error}
        </div>
      )}

      {headerInfo && (
        <div className="mt-8 space-y-4">
          <div className="rounded-xl border border-amber/40 bg-amber/5 px-5 py-4 text-sm text-amber">
            อ่านได้เฉพาะ header ของไฟล์ .bbl ดิบนี้ (firmware/PID/rates/filter ตอน log) — การถอดกราฟ
            noise/tracking error จากเฟรมข้อมูลไบนารีจริงยังไม่รองรับ ถ้าต้องการกราฟเต็มรูปแบบ ให้เปิดไฟล์นี้ใน
            Blackbox Explorer แล้ว export เป็น .csv ก่อนอัปโหลดใหม่
            {headerInfo.logCount > 1 && (
              <> · ไฟล์นี้มีมากกว่า 1 flight log ({headerInfo.logCount} รายการ) header ที่แสดงคือของ log แรกเท่านั้น</>
            )}
          </div>

          <div className="rounded-2xl border border-line-strong bg-bg-panel/70 p-6">
            <span className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">Log info</span>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["Firmware", headerInfo.summary.firmwareRevision],
                  ["Board", headerInfo.summary.board],
                  ["Craft name", headerInfo.summary.craftName],
                  ["Looptime", headerInfo.summary.loopTimeUs ? `${headerInfo.summary.loopTimeUs} µs` : null],
                  ["Roll PID", headerInfo.summary.rollPID],
                  ["Pitch PID", headerInfo.summary.pitchPID],
                  ["Yaw PID", headerInfo.summary.yawPID],
                  ["Rates", headerInfo.summary.rates],
                  ["Gyro lowpass", headerInfo.summary.gyroLowpassHz ? `${headerInfo.summary.gyroLowpassHz} Hz` : null],
                  ["D-term lowpass", headerInfo.summary.dtermLowpassHz ? `${headerInfo.summary.dtermLowpassHz} Hz` : null],
                ] as const
              )
                .filter(([, value]) => value !== null)
                .map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-line px-4 py-3">
                    <p className="font-hud text-[10px] uppercase tracking-[0.15em] text-muted">{label}</p>
                    <p className="font-hud mt-1 text-sm text-ink">{value}</p>
                  </div>
                ))}
            </div>
            {Object.values(headerInfo.summary).every((v) => v === null) && (
              <p className="mt-2 text-sm text-muted">
                ไม่พบชื่อ field ที่รู้จักในไฟล์นี้ (ชื่อ field ต่างกันไปตามเวอร์ชัน firmware) — ดูค่าดิบทั้งหมดด้านล่าง
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowRawHeader((v) => !v)}
              className="font-hud mt-4 text-xs uppercase tracking-[0.15em] text-phosphor-dim hover:text-phosphor"
            >
              {showRawHeader ? "ซ่อน" : "ดู"} header ดิบทั้งหมด ({headerInfo.headerLineCount} fields)
            </button>
            {showRawHeader && (
              <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-line">
                <table className="w-full text-left text-xs">
                  <tbody>
                    {Object.entries(headerInfo.raw).map(([key, value]) => (
                      <tr key={key} className="border-b border-line last:border-0">
                        <td className="font-hud px-3 py-1.5 text-muted">{key}</td>
                        <td className="px-3 py-1.5 text-ink">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <span className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">Results</span>
            <div className="flex items-center gap-3">
              {savedNotice && <span className="font-hud text-xs text-phosphor">Saved</span>}
              <button
                type="button"
                onClick={handleSaveAnalysis}
                className="font-hud rounded-md border border-line-strong px-4 py-2 text-xs uppercase tracking-[0.15em] text-phosphor hover:bg-phosphor hover:text-[#04140b]"
              >
                Save analysis
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 font-hud sm:grid-cols-4">
            <div className="rounded-lg border border-line px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.15em] text-phosphor-dim">Samples</p>
              <p className="mt-1 text-lg text-ink">{result.sampleCount.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-line px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.15em] text-phosphor-dim">Duration</p>
              <p className="mt-1 text-lg text-ink">
                {result.durationSeconds !== null ? `${result.durationSeconds.toFixed(1)}s` : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-line px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.15em] text-phosphor-dim">Motor sat.</p>
              <p className="mt-1 text-lg text-amber">
                {result.motorSaturationPercent !== null ? `${result.motorSaturationPercent.toFixed(1)}%` : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-line px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.15em] text-phosphor-dim">Battery sag</p>
              <p className="mt-1 text-lg text-amber">
                {result.battery ? `${result.battery.sagPercent.toFixed(1)}%` : "—"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-line-strong bg-bg-panel/70 p-6">
            <span className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">
              Tracking error & jitter ต่อแกน
            </span>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {(["roll", "pitch", "yaw"] as const).map((axis) => {
                const stats = result.axisStats[axis];
                return (
                  <div key={axis} className="rounded-lg border border-line px-4 py-3">
                    <p className="font-display text-sm font-medium text-ink">{AXIS_LABELS[axis]}</p>
                    <p className="font-hud mt-2 text-xs text-muted">RMS tracking error</p>
                    <p className="font-hud text-lg text-phosphor">
                      {stats.rmsTrackingError !== null ? `${stats.rmsTrackingError.toFixed(1)}°/s` : "—"}
                    </p>
                    <p className="font-hud mt-2 text-xs text-muted">Jitter (avg Δ)</p>
                    <p className="font-hud text-lg text-ink">
                      {stats.jitter !== null ? `${stats.jitter.toFixed(2)}°/s` : "—"}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-muted">
              Tracking error = setpoint − gyro (ยิ่งต่ำยิ่งดี) · Jitter = ค่าเฉลี่ยความต่างระหว่างตัวอย่างติดกัน
              (ตัวชี้วัดหยาบ ดู noise spectrum เต็มรูปแบบด้านล่างสำหรับรายละเอียดความถี่)
            </p>
          </div>

          <div className="rounded-2xl border border-line-strong bg-bg-panel/70 p-6">
            <span className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">
              Noise spectrum (FFT) ต่อแกน
            </span>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {(["roll", "pitch", "yaw"] as const).map((axis) => {
                const spectrum = result.axisStats[axis].spectrum;
                if (!spectrum) {
                  return (
                    <div key={axis} className="rounded-lg border border-line px-4 py-3 text-sm text-muted">
                      {AXIS_LABELS[axis]}: ข้อมูลไม่พอสำหรับวิเคราะห์ความถี่
                    </div>
                  );
                }
                const band = categorizeNoiseBand(spectrum.peakFrequencyHz);
                const path = spectrumToPath(spectrum.magnitudes);
                return (
                  <div key={axis} className="rounded-lg border border-line px-4 py-3">
                    <p className="font-display text-sm font-medium text-ink">{AXIS_LABELS[axis]}</p>
                    <svg viewBox="0 0 200 60" className="mt-2 w-full" preserveAspectRatio="none">
                      <path d={path} fill="none" stroke="var(--tool-blackbox)" strokeWidth="1.5" />
                    </svg>
                    <p className="font-hud mt-2 text-xs text-muted">Peak noise</p>
                    <p className="font-hud text-lg text-amber">{Math.round(spectrum.peakFrequencyHz)} Hz</p>
                    <p className="mt-1 text-[11px] text-muted">{noiseBandLabel[band]}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-muted">
              คำนวณจาก FFT จริง (Hann window ก่อนแปลง) ไม่ใช่การประมาณ — แกน X คือความถี่ 0 ถึง Nyquist
              ของ log นี้ แกน Y คือ amplitude สัมพัทธ์ การจัดกลุ่มความถี่เป็นแนวทางคร่าว ๆ จากความรู้ทั่วไปของชุมชน
              FPV ไม่ใช่การวินิจฉัยที่แม่นยำ 100%
            </p>
          </div>

          {result.throttleNoise && result.throttleNoise.peakBinIndex !== null && (
            <div className="rounded-2xl border border-line-strong bg-bg-panel/70 p-6">
              <span className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">
                Noise vs throttle level
              </span>
              <div className="mt-4 flex items-end gap-3" style={{ height: 90 }}>
                {result.throttleNoise.bins.map((bin, i) => {
                  const maxRms = Math.max(...result.throttleNoise!.bins.map((b) => b.rmsGyroMagnitude), 1e-6);
                  const heightPercent = bin.sampleCount > 0 ? (bin.rmsGyroMagnitude / maxRms) * 100 : 0;
                  const isPeak = i === result.throttleNoise!.peakBinIndex;
                  return (
                    <div key={bin.label} className="flex flex-1 flex-col items-center justify-end gap-1" style={{ height: "100%" }}>
                      <div
                        className={`w-full rounded-t ${isPeak ? "bg-amber" : "bg-phosphor/40"}`}
                        style={{ height: `${Math.max(4, heightPercent)}%` }}
                      />
                      <span className="font-hud text-[10px] text-muted">{bin.label}</span>
                    </div>
                  );
                })}
              </div>
              {result.throttleNoise.propWashLikely ? (
                <p className="mt-4 rounded-lg border border-amber/40 bg-amber/5 px-4 py-3 text-sm text-amber">
                  ⚠ Noise สูงเด่นชัดที่ throttle ช่วงกลาง (
                  {result.throttleNoise.bins[result.throttleNoise.peakBinIndex].label}) — ลักษณะนี้ตรงกับ
                  prop wash ทั่วไป ลองเช็ค filter หรือปรับ D-term ช่วงกลาง throttle
                </p>
              ) : (
                <p className="mt-4 text-xs text-muted">
                  ไม่พบรูปแบบ noise ที่เด่นชัดเฉพาะช่วง throttle กลาง — อาจไม่ใช่ prop wash แบบทั่วไป
                </p>
              )}
              <p className="mt-3 text-xs text-muted">
                แบ่งช่วง throttle ตามค่าสูงสุด-ต่ำสุดที่พบจริงในไฟล์นี้ (ไม่ใช่ค่าคงที่ตายตัว) แล้ววัด RMS
                ของขนาดสัญญาณ gyro รวม 3 แกนในแต่ละช่วง — เป็นสัญญาณบ่งชี้ ไม่ใช่การวินิจฉัยที่แน่นอน
              </p>
            </div>
          )}

          {result.battery && (
            <div className="rounded-2xl border border-line-strong bg-bg-panel/70 p-6">
              <span className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">แรงดันแบต</span>
              <div className="mt-3 grid grid-cols-3 gap-3 font-hud text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted">Min</p>
                  <p className="text-lg text-ink">{result.battery.min.toFixed(2)}v</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted">Avg</p>
                  <p className="text-lg text-ink">{result.battery.avg.toFixed(2)}v</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted">Max</p>
                  <p className="text-lg text-ink">{result.battery.max.toFixed(2)}v</p>
                </div>
              </div>
            </div>
          )}

          {suggestion && (
            <div className="rounded-2xl border border-line-strong bg-bg-panel/70 p-6">
              <span className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">
                ส่งต่อไป PID Advisor
              </span>
              <p className="mt-2 text-sm text-ink">{suggestion.label}</p>
              {suggestion.direction !== "balanced" && (
                <Link
                  href={`/tools/pid?${[
                    suggestion.pAdjustPercent ? `pAdj=${suggestion.pAdjustPercent}` : null,
                    suggestion.dAdjustPercent ? `dAdj=${suggestion.dAdjustPercent}` : null,
                  ]
                    .filter(Boolean)
                    .join("&")}`}
                  className="font-hud mt-4 inline-block rounded-md border border-line-strong px-4 py-2 text-xs uppercase tracking-[0.15em] text-phosphor hover:bg-phosphor hover:text-[#04140b]"
                >
                  เปิดใน PID Advisor พร้อมคำแนะนำนี้ →
                </Link>
              )}
            </div>
          )}

          {result.warnings.length > 0 && (
            <div className="space-y-2">
              {result.warnings.map((w) => (
                <div key={w} className="rounded-lg border border-amber/40 bg-amber/5 px-4 py-3 text-sm text-amber">
                  {w}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {savedAnalyses.length > 0 && (
        <div className="mt-8 rounded-2xl border border-line-strong bg-bg-panel/70 p-6">
          <span className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">
            Saved analyses ({savedAnalyses.length})
          </span>
          <ul className="mt-3 space-y-2">
            {savedAnalyses.map((a) => (
              <li key={a.id} className="rounded-lg border border-line px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-ink">
                      {a.fileName}
                      {a.buildProfileName && (
                        <span className="font-hud ml-2 text-[10px] uppercase tracking-[0.15em] text-muted">
                          · {a.buildProfileName}
                        </span>
                      )}
                    </p>
                    <p className="font-hud mt-1 text-[11px] text-muted">
                      {a.durationSeconds !== null ? `${a.durationSeconds.toFixed(1)}s` : "—"} ·{" "}
                      {a.motorSaturationPercent !== null ? `${a.motorSaturationPercent.toFixed(1)}% sat.` : "—"} ·{" "}
                      {new Date(a.createdAt).toLocaleDateString("th-TH")}
                    </p>
                    {a.suggestionLabel && <p className="mt-1 text-xs text-muted">{a.suggestionLabel}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAnalysis(a.id)}
                    className="font-hud shrink-0 text-[11px] uppercase tracking-[0.15em] text-muted hover:text-danger"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            บันทึกเฉพาะสรุปผล (ไม่ใช่ไฟล์ log ดิบ) ไว้ในเครื่องนี้เท่านั้น เก็บล่าสุด 10 รายการ
          </p>
        </div>
      )}
    </div>
  );
}
