import Reveal from "./Reveal";

const faqs = [
  {
    q: "ทำไมต้องสร้างใหม่ทั้งหมด ไม่ใช่แค่ปรับเว็บเดิม?",
    a: "เว็บเดิมเป็นหน้า static เพจเดียวไม่มี routing, ไม่มี build system และข้อมูลเครื่องมือซ้ำกันระหว่าง HTML กับ JS การสร้างใหม่บน Next.js ทำให้มี routing จริง, SEO ต่อหน้า, และโครงสร้างที่พร้อมต่อยอดเป็นแอพ",
  },
  {
    q: "เว็บนี้เหมาะกับใคร?",
    a: "เหมาะกับ FPV pilots ทุกระดับ โดยเฉพาะคนที่อยากได้เครื่องมือที่เข้าใจง่ายแต่ยังลึกพอสำหรับการใช้งานจริง",
  },
  {
    q: "ตอนนี้เครื่องมือไหนใช้งานได้จริงบ้าง?",
    a: "ครบทั้ง 6 เครื่องมือใช้งานได้จริงแล้ว — PID Advisor, Rates Visualizer, Build Helper, Blackbox Analyzer, Smart Presets, Flight Readiness แต่ละหน้าบอกสถานะจริงตรง ๆ (beta/live) ไม่ใช่ mockup",
  },
  {
    q: "ต่อยอดเป็นแอพได้ไหม?",
    a: "ได้ โครงสร้างรองรับ PWA install อยู่แล้ว (manifest + service worker) มี Dashboard และ Build Profile ที่เชื่อมทุกเครื่องมือเข้าด้วยกันแล้ว ส่วน cloud sync ข้ามอุปกรณ์เป็นแผนในอนาคตแบบไม่ต้องมีบัญชีผู้ใช้ (ตั้งใจให้เป็น local-first)",
  },
];

export default function FaqSection() {
  return (
    <section id="faq" className="container-hud py-20">
      <Reveal>
        <span className="font-hud text-xs uppercase tracking-[0.2em] text-phosphor-dim">FAQ</span>
        <h2 className="font-display mt-3 max-w-xl text-3xl font-semibold text-ink md:text-4xl">
          Questions worth answering up front
        </h2>
      </Reveal>

      <div className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line">
        {faqs.map((item) => (
          <details key={item.q} className="group px-5 py-4 transition-colors open:bg-phosphor/[0.03] hover:bg-white/[0.02]">
            <summary className="font-display flex cursor-pointer list-none items-center justify-between text-base font-medium text-ink marker:content-none">
              {item.q}
              <span className="font-hud ml-4 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-phosphor-dim transition-all group-open:rotate-45 group-open:border-phosphor group-open:text-phosphor">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
