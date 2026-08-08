import Reveal from "./Reveal";

const phases = [
  {
    phase: "Phase 1",
    title: "Foundation rebuild",
    copy: "วางโครงหน้าแรก, navigation, design system, และ component หลักทั้งหมด",
    done: true,
  },
  {
    phase: "Phase 2",
    title: "Tool ecosystem",
    copy: "ครบทั้ง 6 เครื่องมือ ใช้งานได้จริง เชื่อมกับ Build Profile และ Dashboard เดียวกัน",
    done: true,
  },
  {
    phase: "Phase 3",
    title: "Product polish",
    copy: "test suite, skip link + keyboard nav ด้วยมือ, WCAG contrast คำนวณจริง, font subsetting, security patch, และ Lighthouse accessibility audit ผ่าน 100/100 ครบทั้ง 13 หน้า (8 ส.ค. 2569) — พบและแก้ heading order bug 1 จุดระหว่างตรวจ (Flight Readiness) — ตรวจสอบแล้วจริง",
    done: true,
  },
  {
    phase: "Phase 4",
    title: "What's next",
    copy: "รัน full axe-core suite ผ่าน Playwright จริง (มี e2e/a11y.spec.ts พร้อมแล้ว รอรันบนเครื่องที่ install browser ได้ — Lighthouse ที่ผ่านแล้วเป็นแค่ subset ~50 จาก 96 กฎ), ถอดกราฟ noise/tracking error จากเฟรมไบนารีของไฟล์ .bbl ดิบ (รอตัวอย่างจริงมา verify — ตอนนี้อ่านได้แค่ header), step response analysis, และฟีเจอร์ตามเสียงตอบรับจากนักบินจริง",
    done: false,
  },
];

export default function RoadmapSection() {
  return (
    <section id="roadmap" className="container-hud py-12 md:py-20">
      <Reveal>
        <span className="font-hud text-xs uppercase tracking-[0.2em] text-phosphor-dim">Build roadmap</span>
        <h2 className="font-display mt-3 max-w-xl text-3xl font-semibold text-ink md:text-4xl">
          From landing page to a real product foundation
        </h2>
      </Reveal>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {phases.map((item, i) => (
          <Reveal key={item.phase} delay={i * 60}>
            <article
              style={{ "--tool-color": "var(--phosphor)" } as React.CSSProperties}
              className={`tool-card hud-corners h-full rounded-xl border px-5 py-6 ${
                item.done ? "border-phosphor/50" : "border-line"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim">{item.phase}</span>
                <span
                  className={`font-hud flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    item.done ? "bg-phosphor text-[#04140b]" : "border border-line text-muted"
                  }`}
                  aria-hidden="true"
                >
                  {item.done ? "✓" : i + 1}
                </span>
              </div>
              <h3 className="font-display mt-2 text-lg font-medium text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.copy}</p>
              {item.done && (
                <span className="font-hud mt-3 inline-block rounded-full bg-phosphor/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-phosphor">
                  Shipped
                </span>
              )}
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
