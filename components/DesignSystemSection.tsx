import Reveal from "./Reveal";

const pillars = [
  { label: "Speed", copy: "หน้าเว็บต้องโหลดไว ใช้ง่าย และพาไปยังเครื่องมือที่ต้องการได้ทันที", color: "pid" },
  { label: "Clarity", copy: "โครงสร้างข้อมูลและคำอธิบายต้องชัดเจนสำหรับทั้งมือใหม่และสายจริงจัง", color: "flight" },
  { label: "Trust", copy: "ภาพรวมแบรนด์ต้องดูน่าเชื่อถือเหมือนเป็น product ที่พร้อมใช้งานจริง", color: "presets" },
  { label: "Scale", copy: "โครงสร้างต้องพร้อมต่อยอดไปยัง PWA และ mobile app ในอนาคต", color: "blackbox" },
] as const;

export default function DesignSystemSection() {
  return (
    <section id="design" className="container-hud py-12 md:py-20">
      <Reveal>
        <span className="font-hud text-xs uppercase tracking-[0.2em] text-phosphor-dim">Design system</span>
        <h2 className="font-display mt-3 max-w-xl text-3xl font-semibold text-ink md:text-4xl">
          One instrument-panel language, reused everywhere
        </h2>
        <p className="mt-3 max-w-lg text-muted">
          Every screen borrows the same OSD vocabulary pilots already trust —
          monospace readouts, hairline grids, a single phosphor accent.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map((pillar, i) => (
          <Reveal key={pillar.label} delay={i * 60}>
            <article
              style={{ "--tool-color": `var(--tool-${pillar.color})` } as React.CSSProperties}
              className="h-full rounded-xl border border-line px-5 py-6 transition-colors hover:border-[var(--tool-color)]"
            >
              <span className="font-hud text-xs uppercase tracking-[0.15em] text-[var(--tool-color)]">{pillar.label}</span>
              <p className="mt-3 text-sm leading-relaxed text-muted">{pillar.copy}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-2xl border border-line-strong bg-bg-panel/70 p-6">
            <span className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">Brand direction</span>
            <h3 className="font-display mt-2 text-xl font-medium text-ink">
              OBIXCONFIG FPV should feel like a cockpit, not a dashboard
            </h3>
            <p className="mt-2 text-sm text-muted">
              High-contrast phosphor green stays the signature core — nav, CTAs,
              telemetry. Each of the six tools carries its own instrument color
              so the toolkit reads as one brand with six unmistakable dials.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 font-hud text-[11px] text-muted">
              {["dark first", "phosphor core", "6 instrument colors", "OSD grid", "hairline borders"].map((tag) => (
                <span key={tag} className="rounded-full border border-line px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(["pid", "blackbox", "build", "rates", "flight", "presets"] as const).map((c) => (
                <span
                  key={c}
                  className="h-6 w-6 rounded-full border border-line-strong"
                  style={{ background: `var(--tool-${c})` }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div className="grid h-full grid-cols-2 gap-3 rounded-2xl border border-line-strong bg-bg-panel/70 p-6">
            {[
              { title: "Landing", copy: "hero, tools, design, roadmap" },
              { title: "Dashboard", copy: "overview and quick actions" },
              { title: "Tools", copy: "analysis, presets, calculators" },
              { title: "App path", copy: "PWA install, offline shell" },
            ].map((item) => (
              <div key={item.title}>
                <strong className="font-display block text-sm text-ink">{item.title}</strong>
                <p className="mt-1 text-xs text-muted">{item.copy}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
