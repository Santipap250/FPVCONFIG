import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHeader from "@/components/PageHeader";
import FaqSection from "@/components/FaqSection";

export const metadata: Metadata = {
  title: "FAQ",
  description: "คำถามที่พบบ่อยเกี่ยวกับ OBIXCONFIG FPV",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-hud py-14">
        <PageHeader eyebrow="FAQ" title="คำถามที่พบบ่อย" />
        <FaqSection />
      </main>
      <SiteFooter />
    </>
  );
}
