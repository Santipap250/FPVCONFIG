export interface FaqItem {
  q: string;
  a: string;
}

// Single source of truth for FAQ content — consumed by both the visible
// FaqSection UI and the FAQPage JSON-LD structured data, so the two never
// drift out of sync.
export const faqs: FaqItem[] = [
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
