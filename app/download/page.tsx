import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Download",
  description: "วิธีติดตั้ง OBIXCONFIG FPV เป็นแอพผ่าน PWA บนมือถือและเดสก์ท็อป",
  alternates: { canonical: "/download" },
};

const platforms = [
  {
    name: "Android (Chrome)",
    steps: [
      "เปิดเว็บนี้ใน Chrome",
      "แตะเมนู ⋮ มุมขวาบน",
      "เลือก \"Install app\" หรือ \"Add to Home screen\"",
      "ยืนยัน — ไอคอนจะไปอยู่ที่หน้าโฮมเหมือนแอพปกติ",
    ],
  },
  {
    name: "iOS (Safari)",
    steps: [
      "เปิดเว็บนี้ใน Safari (ต้องเป็น Safari เท่านั้น ใช้ browser อื่นจะไม่มีตัวเลือกนี้)",
      "แตะปุ่ม Share (ไอคอนสี่เหลี่ยมมีลูกศรชี้ขึ้น)",
      "เลื่อนหาแล้วแตะ \"Add to Home Screen\"",
      "แตะ \"Add\" — ไอคอนจะไปอยู่ที่หน้าโฮม เปิดแบบเต็มจอไม่มี address bar",
    ],
  },
  {
    name: "Desktop (Chrome / Edge)",
    steps: [
      "เปิดเว็บนี้ในเบราว์เซอร์",
      "สังเกตไอคอน install (⊕ หรือจอมี +) ที่ address bar ด้านขวา",
      "คลิกแล้วเลือก \"Install\"",
      "แอพจะเปิดเป็นหน้าต่างแยก ไม่มี tab bar ของเบราว์เซอร์",
    ],
  },
];

export default function DownloadPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-hud py-14">
        <PageHeader
          eyebrow="Download"
          title="ติดตั้งเป็นแอพผ่าน PWA"
          lead="ยังไม่มีแอพแยกบน App Store / Play Store — ตอนนี้ติดตั้งผ่าน PWA ได้ทันที ใช้งานออฟไลน์บางส่วนได้ และไอคอนจะอยู่หน้าโฮมเหมือนแอพปกติ"
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {platforms.map((platform, i) => (
            <Reveal key={platform.name} delay={i * 60}>
              <article className="h-full rounded-2xl border border-line-strong bg-bg-panel/70 p-6">
                <h2 className="font-display text-lg font-medium text-ink">{platform.name}</h2>
                <ol className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
                  {platform.steps.map((step, idx) => (
                    <li key={step} className="flex gap-2">
                      <span className="font-hud text-phosphor-dim">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={220}>
          <div className="mt-10 rounded-2xl border border-line px-6 py-5 text-sm text-muted">
            ยังไม่รองรับการติดตั้งแบบไม่ต้องเปิดเว็บก่อน (เช่นผ่าน QR code ตรง ๆ)
            และยังไม่มีแพ็กเกจสำหรับ App Store / Play Store — เป็นแผนของเฟส &quot;App expansion&quot; ในอนาคต
          </div>
        </Reveal>
      </main>
      <SiteFooter />
    </>
  );
}
