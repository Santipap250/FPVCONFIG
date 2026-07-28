"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const DroneScene = dynamic(() => import("./DroneScene"), { ssr: false });

const FIELDS = [
  { label: "MODE", value: "ACRO" },
  { label: "SATS", value: "14" },
  { label: "ALT", value: "62m" },
  { label: "DIST", value: "340m" },
];

export default function HudPanel() {
  const [volt, setVolt] = useState(16.8);
  const [rssi, setRssi] = useState(94);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setVolt((v) => {
        const next = v - 0.02 + (Math.random() - 0.5) * 0.03;
        return Math.min(16.9, Math.max(15.1, next));
      });
      setRssi((r) => {
        const next = r + Math.round((Math.random() - 0.5) * 4);
        return Math.min(99, Math.max(78, next));
      });
      setTimer((t) => t + 1);
    }, 1200);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(timer / 60)).padStart(2, "0");
  const ss = String(timer % 60).padStart(2, "0");

  return (
    <div
      className="relative overflow-hidden rounded-[var(--radius)] border border-line-strong bg-bg-panel/80 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
      role="img"
      aria-label="Simulated FPV OSD telemetry preview: battery, GPS, RSSI, and flight mode readouts"
    >
      <div className="hud-grid" aria-hidden="true" />
      <div className="hud-scanlines" aria-hidden="true" />

      <div className="relative z-10 flex items-center justify-between font-hud text-[11px] uppercase tracking-[0.2em] text-phosphor-dim">
        <span>obixconfig // live console</span>
        <span className="tick text-phosphor">● rec</span>
      </div>

      {/* 3D drone preview */}
      <div className="relative z-10 mt-4 h-40 overflow-hidden rounded-xl border border-line bg-[#04120b]">
        <DroneScene />
        <div className="hud-grid pointer-events-none opacity-40" aria-hidden="true" />
        <div className="font-hud pointer-events-none absolute bottom-2 left-2 text-[10px] text-phosphor/80">
          HDG 214
        </div>
        <div className="font-hud pointer-events-none absolute bottom-2 right-2 text-[10px] text-phosphor/80">
          {mm}:{ss}
        </div>
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-2 gap-3 font-hud text-xs">
        <div className="rounded-lg border border-line px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-phosphor-dim">Battery</p>
          <p className="mt-1 text-lg text-phosphor">{volt.toFixed(1)}v</p>
        </div>
        <div className="rounded-lg border border-line px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-phosphor-dim">RSSI</p>
          <p className="mt-1 text-lg text-amber">{rssi}%</p>
        </div>
        {FIELDS.map((field) => (
          <div key={field.label} className="rounded-lg border border-line px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-phosphor-dim">{field.label}</p>
            <p className="mt-1 text-lg text-ink">{field.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
