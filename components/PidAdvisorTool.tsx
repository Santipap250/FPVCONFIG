"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { calculatePid, applyAdjustment, type FlyingStyle, type PidAdjustment } from "@/lib/pidAdvisor";
import { useBuildProfiles } from "@/lib/useBuildProfiles";
import { useLocalStorage } from "@/lib/useLocalStorage";
import type { SavedPreset } from "@/lib/presets";
import ActiveBuildBanner from "./ActiveBuildBanner";

const styles: { value: FlyingStyle; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "freestyle", label: "Freestyle" },
  { value: "cinematic", label: "Cinematic" },
  { value: "racing", label: "Racing" },
  { value: "longrange", label: "Long range" },
  { value: "micro", label: "Micro" },
];

const DEFAULTS = { propSizeInches: 5, motorKv: 1700, cells: 4, style: "freestyle" as FlyingStyle };
const PRESETS_KEY = "saved-presets-v1";

interface PidInputsState {
  propSizeInches: number;
  motorKv: number;
  cells: number;
  style: FlyingStyle;
}

export default function PidAdvisorTool({ initialAdjustment }: { initialAdjustment?: PidAdjustment }) {
  const { activeProfile } = useBuildProfiles();
  // Remembers the pilot's last inputs across visits — independent of Active
  // Build, for quick standalone sessions without needing a saved build.
  const [inputs, setInputs] = useLocalStorage<PidInputsState>("pid-advisor-inputs-v1", DEFAULTS);
  const [saved, setSaved] = useLocalStorage<SavedPreset[]>(PRESETS_KEY, []);
  const [copied, setCopied] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const { propSizeInches, motorKv, cells, style } = inputs;
  const setField = <K extends keyof PidInputsState>(key: K, value: PidInputsState[K]) =>
    setInputs({ ...inputs, [key]: value });

  const loadFromActiveBuild = () => {
    if (!activeProfile) return;
    setInputs({
      propSizeInches: activeProfile.frameSizeInches ?? propSizeInches,
      motorKv: activeProfile.motorKv ?? motorKv,
      cells: activeProfile.batteryCells ?? cells,
      style: activeProfile.flyingStyle ?? style,
    });
  };

  const resetToDefaults = () => setInputs(DEFAULTS);

  const baseResult = useMemo(
    () => calculatePid({ propSizeInches, motorKv, cells, style }),
    [propSizeInches, motorKv, cells, style]
  );

  const result = useMemo(
    () => (initialAdjustment ? applyAdjustment(baseResult, initialAdjustment) : baseResult),
    [baseResult, initialAdjustment]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.cliSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleSavePreset = () => {
    const defaultName = `PID ${propSizeInches}" ${styles.find((s) => s.value === style)?.label ?? style}`;
    const entry: SavedPreset = {
      id: `${Date.now()}`,
      name: nameDraft.trim() || defaultName,
      createdAt: new Date().toISOString(),
      cliSnippet: result.cliSnippet,
      buildProfileName: activeProfile?.name,
    };
    setSaved([entry, ...saved].slice(0, 20));
    setNameDraft("");
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="mt-10">
      <ActiveBuildBanner />
      {initialAdjustment && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-phosphor/40 bg-phosphor/5 px-5 py-4">
          <p className="text-sm text-ink">
            <span className="font-hud text-phosphor">ปรับจาก Blackbox Analyzer:</span> {initialAdjustment.label}
          </p>
          <Link
            href="/tools/pid"
            className="font-hud shrink-0 text-[11px] uppercase tracking-[0.15em] text-muted hover:text-danger"
          >
            ล้างการปรับ
          </Link>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      {/* Inputs */}
      <div className="rounded-2xl border border-line-strong bg-bg-panel/70 p-6">
        <div className="flex items-center justify-between">
          <span className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">Build inputs</span>
          <div className="flex items-center gap-3">
            {activeProfile && (
              <button
                type="button"
                onClick={loadFromActiveBuild}
                className="font-hud text-[11px] uppercase tracking-[0.15em] text-phosphor-dim hover:text-phosphor"
              >
                โหลดจาก Active Build
              </button>
            )}
            <button
              type="button"
              onClick={resetToDefaults}
              className="font-hud text-[11px] uppercase tracking-[0.15em] text-muted hover:text-ink"
            >
              Reset
            </button>
          </div>
        </div>

        <label className="mt-5 block text-sm text-muted">
          ขนาด Prop: <span className="font-hud text-ink">{propSizeInches}&quot;</span>
          <input
            type="range"
            min={2.5}
            max={7}
            step={0.5}
            value={propSizeInches}
            onChange={(e) => setField("propSizeInches", Number(e.target.value))}
            className="mt-2 w-full accent-phosphor"
          />
        </label>

        <label className="mt-5 block text-sm text-muted">
          มอเตอร์ KV: <span className="font-hud text-ink">{motorKv}</span>
          <input
            type="range"
            min={900}
            max={3000}
            step={50}
            value={motorKv}
            onChange={(e) => setField("motorKv", Number(e.target.value))}
            className="mt-2 w-full accent-phosphor"
          />
        </label>

        <fieldset className="mt-5">
          <legend className="text-sm text-muted">แบตเตอรี่</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[3, 4, 6, 8].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setField("cells", s)}
                aria-pressed={cells === s}
                className={`font-hud rounded-md border px-3 py-1.5 text-xs ${
                  cells === s ? "border-phosphor bg-phosphor/10 text-phosphor" : "border-line text-muted"
                }`}
              >
                {s}S
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="text-sm text-muted">สไตล์การบิน</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {styles.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setField("style", s.value)}
                aria-pressed={style === s.value}
                className={`font-hud rounded-md border px-3 py-1.5 text-xs ${
                  style === s.value ? "border-phosphor bg-phosphor/10 text-phosphor" : "border-line text-muted"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>

        <p className="mt-5 text-xs text-muted">ค่าที่กรอกไว้จำอัตโนมัติในเครื่องนี้ กลับมาเปิดใหม่จะยังอยู่</p>
      </div>

      {/* Results */}
      <div className="rounded-2xl border border-line-strong bg-bg-panel/70 p-6">
        <span className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">Suggested baseline</span>

        <div className="mt-4 grid grid-cols-3 gap-3 font-hud text-center text-sm">
          {(["roll", "pitch"] as const).map((axis) => (
            <div key={axis} className="col-span-3 grid grid-cols-3 gap-3 sm:col-span-1">
              <div className="rounded-lg border border-line px-2 py-2">
                <p className="text-[10px] uppercase tracking-[0.15em] text-phosphor-dim">{axis} P</p>
                <p className="mt-1 text-lg text-phosphor">{result[axis].p}</p>
              </div>
              <div className="rounded-lg border border-line px-2 py-2">
                <p className="text-[10px] uppercase tracking-[0.15em] text-phosphor-dim">{axis} I</p>
                <p className="mt-1 text-lg text-ink">{result[axis].i}</p>
              </div>
              <div className="rounded-lg border border-line px-2 py-2">
                <p className="text-[10px] uppercase tracking-[0.15em] text-phosphor-dim">{axis} D</p>
                <p className="mt-1 text-lg text-amber">{result[axis].d}</p>
              </div>
            </div>
          ))}
          <div className="col-span-3 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-line px-2 py-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-phosphor-dim">yaw P</p>
              <p className="mt-1 text-lg text-phosphor">{result.yaw.p}</p>
            </div>
            <div className="rounded-lg border border-line px-2 py-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-phosphor-dim">D_min</p>
              <p className="mt-1 text-lg text-amber">{result.dMin}</p>
            </div>
            <div className="rounded-lg border border-line px-2 py-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-phosphor-dim">FF</p>
              <p className="mt-1 text-lg text-ink">{result.feedforward}</p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <span className="font-hud text-[11px] uppercase tracking-[0.15em] text-phosphor-dim">เหตุผลของค่าเหล่านี้</span>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted">
            {result.reasons.map((reason) => (
              <li key={reason}>· {reason}</li>
            ))}
          </ul>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="font-hud text-[11px] uppercase tracking-[0.15em] text-phosphor-dim">Betaflight CLI</span>
            <button
              type="button"
              onClick={handleCopy}
              className="font-hud rounded-md border border-line-strong px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-phosphor hover:bg-phosphor hover:text-[#04140b]"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="font-hud mt-2 overflow-x-auto rounded-lg border border-line bg-[#04120b] p-4 text-xs leading-relaxed text-phosphor">
{result.cliSnippet}
          </pre>
        </div>

        <div className="mt-5">
          <span className="font-hud text-[11px] uppercase tracking-[0.15em] text-phosphor-dim">บันทึกเป็นพรีเซ็ตของฉัน</span>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder={`PID ${propSizeInches}" ${styles.find((s) => s.value === style)?.label ?? style}`}
              className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-sm text-ink placeholder:text-muted"
            />
            <button
              type="button"
              onClick={handleSavePreset}
              className="font-hud shrink-0 rounded-md border border-line-strong px-4 py-2 text-xs uppercase tracking-[0.15em] text-phosphor hover:bg-phosphor hover:text-[#04140b]"
            >
              Save
            </button>
          </div>
          {savedNotice && <p className="font-hud mt-2 text-xs text-phosphor">บันทึกแล้ว — ดูได้ที่ Smart Presets</p>}
        </div>

        <p className="mt-4 text-xs text-muted">
          ค่านี้คือจุดเริ่มต้นจาก heuristic ที่อ้างอิงความสัมพันธ์จริงของ prop/มอเตอร์/เซลล์แบต
          ไม่ใช่คำตอบสุดท้าย — ควรทดลองบินและปรับตาม feel จริงหรือใช้ร่วมกับ Blackbox Analyzer เมื่อพร้อมใช้งาน
        </p>
      </div>
    </div>
    </div>
  );
}
