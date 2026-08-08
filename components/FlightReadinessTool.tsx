"use client";

import { checklist, criticalItemIds, totalItems } from "@/lib/flightChecklist";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useBuildProfiles } from "@/lib/useBuildProfiles";
import ActiveBuildBanner from "./ActiveBuildBanner";
import type { BuildProfile } from "@/lib/buildProfile";

const STORAGE_KEY = "flight-readiness-v1";

// Maps a checklist item to the matching Active Build field, so the safety
// item shows the pilot's real equipment instead of a generic reminder.
function equipmentHint(itemId: string, profile: BuildProfile | null): string | null {
  if (!profile) return null;
  switch (itemId) {
    case "props-tight":
    case "props-orientation":
    case "props-damage":
      return profile.propeller ? `ใบพัด: ${profile.propeller}` : null;
    case "battery-voltage":
    case "battery-secure":
    case "battery-connector":
      return profile.batteryCells ? `แบต: ${profile.batteryCells}S${profile.batteryCapacityMah ? ` ${profile.batteryCapacityMah}mAh` : ""}` : null;
    case "vtx-power":
    case "vtx-channel":
      return profile.vtx ? `VTX: ${profile.vtx}` : null;
    case "rx-bind":
      return profile.receiver ? `Receiver: ${profile.receiver}` : null;
    case "frame-screws":
      return profile.frame ? `เฟรม: ${profile.frame}` : null;
    default:
      return null;
  }
}

export default function FlightReadinessTool() {
  const { activeProfile } = useBuildProfiles();
  const [checked, setChecked] = useLocalStorage<Record<string, boolean>>(STORAGE_KEY, {});

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const uncheckedCritical = criticalItemIds.filter((id) => !checked[id]);
  const allDone = checkedCount === totalItems;

  const toggle = (id: string) => setChecked({ ...checked, [id]: !checked[id] });
  const resetAll = () => setChecked({});

  return (
    <div className="mt-10">
      <ActiveBuildBanner />
      <div className="rounded-2xl border border-line-strong bg-bg-panel/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">
              Progress
            </span>
            <p className="font-display mt-1 text-2xl font-medium text-ink">
              {checkedCount} / {totalItems}
            </p>
          </div>
          <button
            type="button"
            onClick={resetAll}
            className="font-hud rounded-md border border-line-strong px-4 py-2 text-xs uppercase tracking-[0.15em] text-muted hover:border-phosphor hover:text-phosphor"
          >
            เริ่มเช็คลิสต์ใหม่ (เที่ยวบินใหม่)
          </button>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full border border-line bg-[#04120b]">
          <div
            className="h-full bg-phosphor transition-all"
            style={{ width: `${totalItems ? (checkedCount / totalItems) * 100 : 0}%` }}
          />
        </div>

        {allDone ? (
          <p className="mt-4 font-hud text-sm uppercase tracking-[0.15em] text-phosphor">
            ✓ ครบทุกข้อ พร้อมบิน
          </p>
        ) : uncheckedCritical.length > 0 ? (
          <p className="mt-4 text-sm text-danger">
            ยังเหลือ {uncheckedCritical.length} ข้อความปลอดภัยที่ยังไม่ได้เช็ค — แนะนำให้เช็คให้ครบก่อนอาร์ม
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted">เหลืออีก {totalItems - checkedCount} ข้อ</p>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {checklist.map((category) => (
          <div key={category.id} className="rounded-2xl border border-line px-5 py-4">
            <h2 className="font-display text-lg font-medium text-ink">{category.title}</h2>
            <ul className="mt-3 space-y-2">
              {category.items.map((item) => (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-phosphor/5">
                    <input
                      type="checkbox"
                      checked={Boolean(checked[item.id])}
                      onChange={() => toggle(item.id)}
                      className="mt-1 h-4 w-4 accent-phosphor"
                    />
                    <span className={`text-sm ${checked[item.id] ? "text-muted line-through" : "text-ink"}`}>
                      {item.label}
                      {item.critical && !checked[item.id] && (
                        <span className="font-hud ml-2 text-[10px] uppercase tracking-[0.15em] text-danger">
                          สำคัญ
                        </span>
                      )}
                      {equipmentHint(item.id, activeProfile) && (
                        <span className="font-hud ml-2 text-[10px] uppercase tracking-[0.15em] text-phosphor-dim">
                          {equipmentHint(item.id, activeProfile)}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted">
        สถานะเช็คลิสต์บันทึกไว้ในเครื่องนี้เท่านั้น (localStorage) กด &quot;เริ่มเช็คลิสต์ใหม่&quot;
        ก่อนบินทุกครั้งที่เป็นเที่ยวบินใหม่ — ยังไม่ sync ข้ามอุปกรณ์จนกว่าจะมีระบบบัญชีผู้ใช้
        {activeProfile && " ป้ายอุปกรณ์ข้างแต่ละข้อดึงมาจาก Active Build จริง ไม่ใช่ค่าคงที่"}
      </p>
    </div>
  );
}
