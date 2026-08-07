import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHeader from "@/components/PageHeader";
import RoadmapSection from "@/components/RoadmapSection";
import Reveal from "@/components/Reveal";
import ToolIcon from "@/components/icons/ToolIcon";
import { tools, statusLabel } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "แผนพัฒนาและสถานะจริงของแต่ละเครื่องมือใน OBIXCONFIG FPV",
  alternates: { canonical: "/roadmap" },
};

export default function RoadmapPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="container-hud py-14">
        <PageHeader
          eyebrow="Roadmap"
          title="สถานะจริงของแต่ละเครื่องมือ"
          lead="อัปเดตตรงกับโค้ดปัจจุบัน ไม่ใช่แผนที่ยังไม่ได้ลงมือทำ"
        />

        <Reveal delay={80}>
          <div className="mt-10 overflow-hidden rounded-2xl border border-line-strong">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-panel/70">
                  <th className="font-hud px-5 py-3 text-xs uppercase tracking-[0.15em] text-phosphor-dim">Tool</th>
                  <th className="font-hud px-5 py-3 text-xs uppercase tracking-[0.15em] text-phosphor-dim">Status</th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool) => (
                  <tr key={tool.slug} className="border-b border-line last:border-0">
                    <td className="px-5 py-3 text-ink">
                      <div className="flex items-center gap-3">
                        <ToolIcon tool={tool.color} size={22} glow={false} />
                        {tool.title}
                      </div>
                    </td>
                    <td
                      style={{ color: tool.status === "live" ? `var(--tool-${tool.color})` : undefined }}
                      className="font-hud px-5 py-3 text-xs uppercase tracking-[0.15em] text-muted"
                    >
                      {statusLabel[tool.status]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        <RoadmapSection />
      </main>
      <SiteFooter />
    </>
  );
}
