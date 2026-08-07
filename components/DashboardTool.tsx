"use client";

import Link from "next/link";
import { useBuildProfiles } from "@/lib/useBuildProfiles";
import { useRecentTools } from "@/lib/useRecentTools";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { tools, statusLabel } from "@/lib/tools";
import { criticalItemIds, totalItems } from "@/lib/flightChecklist";
import type { SavedPreset } from "@/lib/presets";
import { calculatePid } from "@/lib/pidAdvisor";
import BuildProfileManager from "./BuildProfileManager";
import ToolIcon from "./icons/ToolIcon";

export default function DashboardTool() {
  const { activeProfile } = useBuildProfiles();
  const { recentVisits } = useRecentTools();
  const [savedPresets] = useLocalStorage<SavedPreset[]>("saved-presets-v1", []);
  const [checklistState] = useLocalStorage<Record<string, boolean>>("flight-readiness-v1", {});

  const checkedCount = Object.values(checklistState).filter(Boolean).length;
  const uncheckedCritical = criticalItemIds.filter((id) => !checklistState[id]);
  const readinessStatus =
    checkedCount === 0 ? "not-started" : uncheckedCritical.length > 0 ? "critical" : checkedCount === totalItems ? "ready" : "warning";

  const readinessLabel = {
    "not-started": { text: "ยังไม่เริ่มเช็ค", color: "text-muted" },
    critical: { text: "Critical — เหลือข้อสำคัญที่ยังไม่เช็ค", color: "text-danger" },
    warning: { text: "Warning — เช็คยังไม่ครบ", color: "text-amber" },
    ready: { text: "Ready — พร้อมบิน", color: "text-phosphor" },
  }[readinessStatus];

  const recommendation = activeProfile
    ? calculatePid({
        propSizeInches: activeProfile.frameSizeInches ?? 5,
        motorKv: activeProfile.motorKv ?? 1700,
        cells: activeProfile.batteryCells ?? 4,
        style: activeProfile.flyingStyle ?? "freestyle",
      })
    : null;

  const recentTools = recentVisits.map((v) => tools.find((t) => t.slug === v.slug)).filter((t): t is (typeof tools)[number] => Boolean(t));

  return (
    <div className="mt-10 space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <BuildProfileManager />

        <div className="space-y-6">
          <div style={{ "--tool-color": "var(--tool-flight)" } as React.CSSProperties} className="tool-card hud-corners rounded-2xl border border-line-strong p-6">
            <div className="flex items-center gap-3">
              <ToolIcon tool="flight" size={30} />
              <span className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">Flight Readiness</span>
            </div>
            <p className={`font-display mt-3 text-xl font-medium ${readinessLabel.color}`}>{readinessLabel.text}</p>
            <p className="mt-1 text-sm text-muted">
              เช็คแล้ว {checkedCount}/{totalItems} ข้อ
              {uncheckedCritical.length > 0 && ` — เหลือข้อสำคัญ ${uncheckedCritical.length} ข้อ`}
            </p>
            <Link
              href="/tools/flight"
              className="font-hud mt-3 inline-block text-[11px] uppercase tracking-[0.15em] text-phosphor-dim hover:text-phosphor"
            >
              เปิดเช็คลิสต์ →
            </Link>
          </div>

          <div style={{ "--tool-color": "var(--tool-presets)" } as React.CSSProperties} className="tool-card hud-corners rounded-2xl border border-line-strong p-6">
            <div className="flex items-center gap-3">
              <ToolIcon tool="presets" size={30} />
              <span className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">Saved Presets</span>
            </div>
            <p className="font-display mt-3 text-xl font-medium text-ink">{savedPresets.length} รายการ</p>
            {savedPresets.slice(0, 3).map((preset) => (
              <p key={preset.id} className="mt-1 text-sm text-muted">
                {preset.name}
              </p>
            ))}
            <Link
              href="/tools/presets"
              className="font-hud mt-3 inline-block text-[11px] uppercase tracking-[0.15em] text-phosphor-dim hover:text-phosphor"
            >
              จัดการพรีเซ็ต →
            </Link>
          </div>
        </div>
      </div>

      {activeProfile && recommendation && (
        <div className="rounded-2xl border border-phosphor/40 bg-phosphor/5 p-6">
          <span className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">
            Latest Recommendation — จาก Active Build &quot;{activeProfile.name}&quot;
          </span>
          <div className="mt-4 grid grid-cols-3 gap-3 font-hud text-center text-sm sm:grid-cols-6">
            <div className="rounded-lg border border-line px-2 py-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-phosphor-dim">Roll P</p>
              <p className="mt-1 text-lg text-phosphor">{recommendation.roll.p}</p>
            </div>
            <div className="rounded-lg border border-line px-2 py-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-phosphor-dim">Roll D</p>
              <p className="mt-1 text-lg text-amber">{recommendation.roll.d}</p>
            </div>
            <div className="rounded-lg border border-line px-2 py-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-phosphor-dim">Pitch P</p>
              <p className="mt-1 text-lg text-phosphor">{recommendation.pitch.p}</p>
            </div>
            <div className="rounded-lg border border-line px-2 py-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-phosphor-dim">Pitch D</p>
              <p className="mt-1 text-lg text-amber">{recommendation.pitch.d}</p>
            </div>
            <div className="rounded-lg border border-line px-2 py-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-phosphor-dim">Yaw P</p>
              <p className="mt-1 text-lg text-ink">{recommendation.yaw.p}</p>
            </div>
            <div className="rounded-lg border border-line px-2 py-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-phosphor-dim">FF</p>
              <p className="mt-1 text-lg text-ink">{recommendation.feedforward}</p>
            </div>
          </div>
          <Link
            href="/tools/pid"
            className="font-hud mt-4 inline-block text-[11px] uppercase tracking-[0.15em] text-phosphor hover:text-phosphor"
          >
            เปิดใน PID Advisor เพื่อดูเหตุผลเต็ม →
          </Link>
        </div>
      )}

      <div className="rounded-2xl border border-line-strong bg-bg-panel/70 p-6">
        <span className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">Quick Actions</span>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              style={{ "--tool-color": `var(--tool-${tool.color})` } as React.CSSProperties}
              className="tool-card hud-corners flex items-center gap-3 rounded-lg border border-line px-4 py-3"
            >
              <ToolIcon tool={tool.color} size={28} />
              <div>
                <p className="font-display text-sm font-medium text-ink">{tool.title}</p>
                <p className="font-hud mt-0.5 text-[10px] uppercase tracking-[0.15em] text-muted">{statusLabel[tool.status]}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {recentTools.length > 0 && (
        <div className="rounded-2xl border border-line-strong bg-bg-panel/70 p-6">
          <span className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">Recent Tools</span>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentTools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                style={{ "--tool-color": `var(--tool-${tool.color})` } as React.CSSProperties}
                className="font-hud flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-muted hover:border-[var(--tool-color)] hover:text-[var(--tool-color)]"
              >
                <ToolIcon tool={tool.color} size={16} glow={false} />
                {tool.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-line-strong bg-bg-panel/70 p-6">
        <span className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">Export / Share</span>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/tools/presets"
            className="font-hud rounded-md border border-line-strong px-4 py-2 text-xs uppercase tracking-[0.15em] text-phosphor hover:bg-phosphor hover:text-[#04140b]"
          >
            แชร์พรีเซ็ตเป็นลิงก์
          </Link>
          <Link
            href="/settings"
            className="font-hud rounded-md border border-line-strong px-4 py-2 text-xs uppercase tracking-[0.15em] text-ink hover:border-phosphor hover:text-phosphor"
          >
            Export ข้อมูลทั้งหมดเป็น .json
          </Link>
        </div>
      </div>

      <p className="text-xs text-muted">
        ข้อมูลทั้งหมดบน dashboard นี้มาจากสิ่งที่บันทึกไว้ในเครื่องนี้จริง (build profiles, presets, flight checklist,
        ประวัติการเข้าเครื่องมือ) ไม่มีข้อมูลตัวอย่างปลอม — ถ้ายังไม่มี build หรือยังไม่เคยใช้เครื่องมือ การ์ดที่เกี่ยวข้องจะว่างตามจริง
      </p>
    </div>
  );
}
