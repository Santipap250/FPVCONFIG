import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHeader from "@/components/PageHeader";
import SettingsTool from "@/components/SettingsTool";

export const metadata: Metadata = {
  title: "Settings",
  description: "จัดการข้อมูลที่เก็บไว้ในเครื่องสำหรับ OBIXCONFIG FPV",
  alternates: { canonical: "/settings" },
};

export default function SettingsPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-hud py-14">
        <PageHeader
          eyebrow="Settings"
          title="จัดการข้อมูลในเครื่องนี้"
          lead="ยังไม่มีระบบบัญชีผู้ใช้ — ข้อมูลทั้งหมดอยู่ในเบราว์เซอร์นี้เท่านั้น"
        />
        <SettingsTool />
      </main>
      <SiteFooter />
    </>
  );
}
