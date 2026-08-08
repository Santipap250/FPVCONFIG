import Reveal from "./Reveal";

const proofs = [
  {
    label: "สูตรจริง",
    title: "Actual Rates สูตรเดียวกับที่ Betaflight ใช้",
    copy: "Rates Visualizer คำนวณจากสูตร Actual Rates ของ Betaflight ตัวจริง ไม่ใช่การประมาณเอาเอง",
    color: "rates",
  },
  {
    label: "ประมวลผลสัญญาณจริง",
    title: "FFT วิเคราะห์ noise spectrum จริง",
    copy: "Blackbox Analyzer รัน Cooley-Tukey FFT จริงบน log ของคุณ ตรวจสอบความถูกต้องแล้วด้วยสัญญาณความถี่ที่รู้ค่าแน่นอน",
    color: "blackbox",
  },
  {
    label: "ฟิสิกส์จริง",
    title: "Power-to-weight จากไฟฟ้าจริง",
    copy: "Build Helper คำนวณ watt ต่อกรัมจากแรงดัน × กระแสจริง ไม่ใช่เดาแรงขับที่ไม่มีข้อมูลรองรับ",
    color: "build",
  },
  {
    label: "ตรวจสอบแล้ว 8 ส.ค. 2569",
    title: "Accessibility 100/100 — ครบทั้ง 13 หน้า",
    copy: "ตรวจทุก route ในเว็บ (หน้า static 7 + เครื่องมือ 6) ผ่าน Google Lighthouse บนมือถือจริง ได้ 100/100 ทุกหน้า — เป็น axe-core subset ~50 กฎผ่าน Lighthouse ไม่ใช่ full 96-rule suite (โครงสร้างรัน full suite จริงพร้อมแล้ว รอรันบนเครื่องที่ install browser ได้)",
    color: "pid",
  },
] as const;

export default function TrustSection() {
  return (
    <section className="container-hud py-10 md:py-16">
      <Reveal>
        <span className="font-hud text-xs uppercase tracking-[0.2em] text-phosphor-dim">Proof, not promises</span>
        <h2 className="font-display mt-3 max-w-xl text-2xl font-semibold text-ink md:text-3xl">
          ทุกตัวเลขในเว็บนี้อธิบายที่มาได้
        </h2>
      </Reveal>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {proofs.map((proof, i) => (
          <Reveal key={proof.title} delay={i * 60}>
            <article
              style={{ "--tool-color": `var(--tool-${proof.color})` } as React.CSSProperties}
              className="h-full rounded-xl border border-line px-5 py-5 transition-colors hover:border-[var(--tool-color)]"
            >
              <span className="font-hud text-[11px] uppercase tracking-[0.15em] text-[var(--tool-color)]">
                {proof.label}
              </span>
              <h3 className="font-display mt-2 text-sm font-medium leading-snug text-ink">{proof.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">{proof.copy}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
