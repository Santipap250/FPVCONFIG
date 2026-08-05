import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHeader from "@/components/PageHeader";
import DashboardTool from "@/components/DashboardTool";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Command center ของ OBIXCONFIG FPV — build profile, presets, flight readiness, และเครื่องมือทั้งหมดในที่เดียว",
  alternates: { canonical: "/dashboard" },
};

export default function DashboardPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-hud py-14">
        <PageHeader
          eyebrow="Dashboard"
          title="Command Center"
          lead="เลือกหรือสร้าง Build Profile หนึ่งชุด แล้วเครื่องมือต่าง ๆ จะเริ่มใช้ข้อมูลชุดเดียวกัน"
        />
        <DashboardTool />
      </main>
      <SiteFooter />
    </>
  );
}
