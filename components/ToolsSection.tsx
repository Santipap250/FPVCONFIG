"use client";

import { useState } from "react";
import Link from "next/link";
import Reveal from "./Reveal";
import ToolIcon from "./icons/ToolIcon";
import { tools, statusLabel } from "@/lib/tools";

export default function ToolsSection() {
  const [activeSlug, setActiveSlug] = useState(tools[0].slug);
  const active = tools.find((t) => t.slug === activeSlug) ?? tools[0];

  return (
    <section id="tools" className="container-hud py-20">
      <Reveal>
        <span className="font-hud text-xs uppercase tracking-[0.2em] text-phosphor-dim">Core tools</span>
        <h2 className="font-display mt-3 max-w-xl text-3xl font-semibold text-ink md:text-4xl">
          A toolkit that mirrors real FPV workflows
        </h2>
        <p className="mt-3 max-w-lg text-muted">
          Six instruments, one shared data model — each one built to hand off
          straight into the next.
        </p>
      </Reveal>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {tools.map((tool, i) => {
          const isActive = activeSlug === tool.slug;
          return (
            <Reveal key={tool.slug} delay={i * 40}>
              <button
                type="button"
                onClick={() => setActiveSlug(tool.slug)}
                aria-pressed={isActive}
                style={{ "--tool-color": `var(--tool-${tool.color})` } as React.CSSProperties}
                className={`tool-card hud-corners group flex h-full w-full flex-col rounded-xl border p-3.5 text-left sm:p-5 ${
                  isActive ? "border-[var(--tool-color)]" : "border-line"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <ToolIcon tool={tool.color} size={32} className="sm:!h-10 sm:!w-10" />
                  <span
                    className={`font-hud shrink-0 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.15em] ${
                      tool.status === "live"
                        ? "border-[var(--tool-color)] text-[var(--tool-color)]"
                        : "border-line text-muted"
                    }`}
                  >
                    {statusLabel[tool.status]}
                  </span>
                </div>

                <h3 className="font-display mt-3 text-sm font-medium text-ink sm:mt-4 sm:text-lg">{tool.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted sm:text-sm">{tool.short}</p>

                <div className="mt-3 hidden items-center gap-2 font-hud text-[11px] uppercase tracking-[0.15em] text-[var(--tool-color)] opacity-0 transition-opacity group-hover:opacity-100 sm:mt-4 sm:flex">
                  {isActive ? "Viewing below ↓" : "Preview instrument →"}
                </div>
              </button>
            </Reveal>
          );
        })}
      </div>

      <Reveal>
        <div
          style={{ "--tool-color": `var(--tool-${active.color})` } as React.CSSProperties}
          className="mt-8 overflow-hidden rounded-2xl border border-[var(--tool-color)]/50 bg-bg-panel/70 p-6 md:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <ToolIcon tool={active.color} size={52} />
              <div>
                <span className="font-hud text-xs uppercase tracking-[0.15em] text-[var(--tool-color)]">
                  {active.badge} · {statusLabel[active.status]}
                </span>
                <h3 className="font-display mt-1 text-2xl font-semibold text-ink">{active.title}</h3>
                <p className="mt-2 max-w-xl text-muted">{active.description}</p>
              </div>
            </div>
            <Link
              href={`/tools/${active.slug}`}
              className="font-hud shrink-0 rounded-md border border-[var(--tool-color)] px-4 py-2 text-xs uppercase tracking-[0.15em] text-[var(--tool-color)] transition-colors hover:bg-[var(--tool-color)] hover:text-[#04140b]"
            >
              Open tool page →
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {active.chips.map((chip) => (
              <span
                key={chip}
                className="font-hud rounded-full border border-line px-3 py-1 text-[11px] text-muted"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
