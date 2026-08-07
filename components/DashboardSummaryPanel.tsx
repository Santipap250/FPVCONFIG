"use client";

import Link from "next/link";
import { useBuildProfiles } from "@/lib/useBuildProfiles";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useRecentTools } from "@/lib/useRecentTools";
import { totalItems as totalChecklistItems } from "@/lib/flightChecklist";
import { flyingStyleLabels } from "@/lib/buildProfile";
import { tools } from "@/lib/tools";
import { timeAgo } from "@/lib/timeAgo";
import ToolIcon from "./icons/ToolIcon";
import type { ToolIconKey } from "./icons/ToolIcons";

const FLIGHT_READINESS_KEY = "flight-readiness-v1";

function readinessStatus(score: number): { label: string; className: string } {
  if (score >= 85) return { label: "Ready to fly", className: "text-phosphor" };
  if (score >= 60) return { label: "Review before flight", className: "text-amber" };
  return { label: "Not ready", className: "text-danger" };
}

/** 270° arc gauge (matches the OSD look elsewhere in the app), score is a real
 * percentage of the same flight-readiness checklist the /tools/flight page uses —
 * never a placeholder number. */
function ReadinessGauge({ score }: { score: number }) {
  const size = 128;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const startAngle = 135;
  const sweep = 270;
  const circumference = (sweep / 360) * 2 * Math.PI * r;
  const filled = (score / 100) * circumference;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const cx = size / 2;
  const cy = size / 2;
  const start = { x: cx + r * Math.cos(toRad(startAngle)), y: cy + r * Math.sin(toRad(startAngle)) };
  const end = { x: cx + r * Math.cos(toRad(startAngle + sweep)), y: cy + r * Math.sin(toRad(startAngle + sweep)) };
  const largeArc = sweep > 180 ? 1 : 0;
  const path = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Flight readiness score: ${score} out of 100`}
    >
      <path d={path} fill="none" stroke="var(--line-strong)" strokeWidth={stroke} strokeLinecap="round" />
      <path
        d={path}
        fill="none"
        stroke="var(--phosphor)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" className="fill-ink font-display text-3xl font-semibold">
        {score}
      </text>
      <text x={cx} y={cy + 18} textAnchor="middle" className="fill-muted font-hud text-[10px] uppercase tracking-[0.15em]">
        /100
      </text>
    </svg>
  );
}

export default function DashboardSummaryPanel() {
  const { activeProfile } = useBuildProfiles();
  const [checked] = useLocalStorage<Record<string, boolean>>(FLIGHT_READINESS_KEY, {});
  const { recentVisits } = useRecentTools();

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const readinessScore = totalChecklistItems > 0 ? Math.round((checkedCount / totalChecklistItems) * 100) : 0;
  const status = readinessStatus(readinessScore);

  const lastVisit = recentVisits[0];
  const lastTool = lastVisit ? tools.find((t) => t.slug === lastVisit.slug) : null;

  return (
    <div className="mt-14 grid overflow-hidden rounded-2xl border border-phosphor/30 bg-bg-panel/70 md:grid-cols-3 md:divide-x md:divide-line">
      {/* Active build */}
      <div className="flex flex-col gap-4 p-6">
        <p className="font-hud flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-phosphor">
          <span className="h-1.5 w-1.5 rounded-full bg-phosphor" aria-hidden="true" />
          Active build
        </p>
        {activeProfile ? (
          <>
            <div className="flex items-center gap-3">
              <ToolIcon tool="build" size={40} />
              <div>
                <p className="font-display text-lg font-semibold text-ink">{activeProfile.name}</p>
                <p className="font-hud text-xs text-muted">
                  {activeProfile.flyingStyle ? flyingStyleLabels[activeProfile.flyingStyle] : "—"}
                  {activeProfile.frameSizeInches ? ` · ${activeProfile.frameSizeInches}"` : ""}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="font-hud mt-auto inline-flex w-fit items-center gap-1 rounded-md border border-line-strong px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-ink transition-colors hover:border-phosphor hover:text-phosphor"
            >
              View build <span aria-hidden="true">→</span>
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">ยังไม่ได้ตั้งค่า Active Build</p>
            <Link
              href="/dashboard"
              className="font-hud mt-auto inline-flex w-fit items-center gap-1 rounded-md border border-line-strong px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-ink transition-colors hover:border-phosphor hover:text-phosphor"
            >
              ตั้งค่า Build <span aria-hidden="true">→</span>
            </Link>
          </>
        )}
      </div>

      {/* Flight readiness */}
      <div className="flex flex-col items-center gap-3 border-t border-line p-6 text-center md:border-t-0">
        <p className="font-hud flex items-center gap-2 self-start text-[11px] uppercase tracking-[0.2em] text-phosphor md:self-center">
          <span className="h-1.5 w-1.5 rounded-full bg-phosphor" aria-hidden="true" />
          Flight readiness
        </p>
        <ReadinessGauge score={readinessScore} />
        <p className={`font-hud text-xs font-semibold uppercase tracking-[0.15em] ${status.className}`}>{status.label}</p>
      </div>

      {/* Last session */}
      <div className="flex flex-col gap-4 border-t border-line p-6 md:border-t-0">
        <p className="font-hud flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-phosphor">
          <span className="h-1.5 w-1.5 rounded-full bg-phosphor" aria-hidden="true" />
          Last session
        </p>
        {lastTool && lastVisit ? (
          <>
            <div className="flex items-center gap-3">
              <ToolIcon tool={lastTool.slug as ToolIconKey} size={40} />
              <div>
                <p className="font-display text-lg font-semibold text-ink">{lastTool.title}</p>
                <p className="font-hud text-xs text-muted">{timeAgo(lastVisit.visitedAt)}</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="font-hud mt-auto inline-flex w-fit items-center gap-1 rounded-md border border-line-strong px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-ink transition-colors hover:border-phosphor hover:text-phosphor"
            >
              Open dashboard <span aria-hidden="true">→</span>
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">ยังไม่มีการใช้งานเครื่องมือ</p>
            <Link
              href="#tools"
              className="font-hud mt-auto inline-flex w-fit items-center gap-1 rounded-md border border-line-strong px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-ink transition-colors hover:border-phosphor hover:text-phosphor"
            >
              Explore tools <span aria-hidden="true">→</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
