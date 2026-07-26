import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About",
  description: "ที่มาและแนวทางของ OBIXCONFIG FPV — เครื่องมือ tuning สำหรับนักบิน FPV",
};

const principles = [
  {
    title: "คำนวณจากของจริง ไม่ใช่ตัวเลขลอย",
    copy: "ทุกเครื่องมือยึดสูตร/ความสัมพันธ์ที่อธิบายได้ เช่น Rates Visualizer ใช้สูตร Actual Rates ของ Betaflight จริง และ Build Helper คำนวณ power-to-weight จากไฟฟ้าจริง ไม่ใช่เดาแรงขับที่ไม่มีข้อมูลรองรับ",
    accent: "pid",
  },
  {
    title: "บอกสถานะตรงไปตรงมา",
    copy: "เครื่องมือไหนยัง heuristic อยู่ก็บอกว่า beta เครื่องมือไหนยังไม่เสร็จก็บอกว่า planned ไม่มีการทำหน้าตาให้ดูเสร็จกว่าที่เป็นจริง",
    accent: "flight",
  },
  {
    title: "ข้อมูลอยู่ในเครื่องผู้ใช้",
    copy: "Flight Readiness และ Smart Presets เก็บข้อมูลไว้ใน localStorage ของเบราว์เซอร์ ไม่ส่งขึ้น server ส่วน Blackbox Analyzer วิเคราะห์ไฟล์ในเบราว์เซอร์ทั้งหมด",
    accent: "build",
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-hud py-14">
        <PageHeader
          eyebrow="About"
          title="เครื่องมือ FPV ที่อธิบายตัวเองได้ทุกตัวเลข"
          lead="OBIXCONFIG FPV เริ่มจากความต้องการเครื่องมือ tuning ที่ตรงไปตรงมา — บอกได้ว่าทำไมถึงแนะนำค่านี้ ไม่ใช่แค่ทายเลขสวย ๆ"
        />

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {principles.map((p, i) => (
            <Reveal key={p.title} delay={i * 60}>
              <article
                style={{ "--tool-color": `var(--tool-${p.accent})` } as React.CSSProperties}
                className="tool-card hud-corners h-full rounded-2xl border border-line-strong p-6"
              >
                <span className="font-hud inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--tool-color)] text-xs text-[var(--tool-color)]">
                  {i + 1}
                </span>
                <h2 className="font-display mt-4 text-lg font-medium text-ink">{p.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{p.copy}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="tool-card hud-corners mt-12 rounded-2xl border border-line-strong p-8">
            <h2 className="font-display text-xl font-medium text-ink">Stack</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Next.js (App Router) + TypeScript + Tailwind CSS v4 deploy บน Vercel
              ทุกเครื่องมือคำนวณฝั่ง client ทั้งหมด ยังไม่มี backend/database — เป็นแผนของเฟสถัดไปเมื่อถึงเวลาต้องมี
              cloud sync หรือระบบบัญชีผู้ใช้จริง
            </p>
          </div>
        </Reveal>
      </main>
      <SiteFooter />
    </>
  );
}
