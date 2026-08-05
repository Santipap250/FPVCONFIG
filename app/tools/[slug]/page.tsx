import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { tools, statusLabel } from "@/lib/tools";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import PidAdvisorWithParams from "@/components/PidAdvisorWithParams";
import RatesVisualizerTool from "@/components/RatesVisualizerTool";
import BuildHelperTool from "@/components/BuildHelperTool";
import FlightReadinessTool from "@/components/FlightReadinessTool";
import SmartPresetsWithParams from "@/components/SmartPresetsWithParams";
import BlackboxAnalyzerTool from "@/components/BlackboxAnalyzerTool";
import RecentToolTracker from "@/components/RecentToolTracker";
import ToolIcon from "@/components/icons/ToolIcon";
import { jsonLdScript, toolBreadcrumbJsonLd } from "@/lib/structuredData";

// Tools with a real, working implementation. Anything not listed here still
// gets an honest "in development" notice instead of a fake calculator.
const implementedTools: Partial<Record<string, () => React.JSX.Element>> = {
  pid: PidAdvisorWithParams,
  rates: RatesVisualizerTool,
  build: BuildHelperTool,
  flight: FlightReadinessTool,
  presets: SmartPresetsWithParams,
  blackbox: BlackboxAnalyzerTool,
};

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) return {};
  return {
    title: tool.title,
    description: tool.description,
    alternates: { canonical: `/tools/${tool.slug}` },
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) notFound();

  const otherTools = tools.filter((t) => t.slug !== tool.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(toolBreadcrumbJsonLd(tool.title, tool.slug))}
      />
      <RecentToolTracker slug={tool.slug} />
      <SiteHeader />
      <main className="container-hud py-14">
        <Link href="/#tools" className="font-hud text-xs uppercase tracking-[0.15em] text-phosphor-dim hover:text-phosphor">
          ← All tools
        </Link>

        <Reveal>
          <div
            style={{ "--tool-color": `var(--tool-${tool.color})` } as React.CSSProperties}
            className="flex flex-wrap items-start gap-4"
          >
            <ToolIcon tool={tool.color} size={56} className="mt-6 shrink-0" />
            <div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="font-hud rounded-full border border-[var(--tool-color)] px-3 py-1 text-xs uppercase tracking-[0.15em] text-[var(--tool-color)]">
                  {tool.badge}
                </span>
                <span className="font-hud rounded-full border border-line px-3 py-1 text-xs uppercase tracking-[0.15em] text-muted">
                  {statusLabel[tool.status]}
                </span>
              </div>
              <h1 className="font-display mt-4 text-4xl font-semibold text-ink">{tool.title}</h1>
              <p className="mt-3 max-w-xl text-lg text-muted">{tool.description}</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {tool.detail.map((line) => (
              <div key={line} className="rounded-xl border border-line px-5 py-5 text-sm leading-relaxed text-muted">
                {line}
              </div>
            ))}
          </div>
        </Reveal>

        {(() => {
          const ToolComponent = implementedTools[tool.slug];
          if (ToolComponent) {
            return (
              <Reveal delay={140}>
                <Suspense fallback={<div className="mt-10 text-sm text-muted">Loading tool…</div>}>
                  <ToolComponent />
                </Suspense>
              </Reveal>
            );
          }
          return (
            <Reveal delay={140}>
              <div className="mt-8 rounded-xl border border-amber/40 bg-amber/5 px-5 py-4 text-sm text-amber">
                เครื่องมือนี้ยังอยู่ระหว่างพัฒนา — หน้านี้แสดงสถานะและทิศทางจริง ยังไม่ใช่เครื่องมือที่ใช้งานคำนวณได้เต็มรูปแบบ
              </div>
            </Reveal>
          );
        })()}

        <Reveal delay={200}>
          <div className="mt-14">
            <h2 className="font-display text-xl font-medium text-ink">Other tools</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {otherTools.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  style={{ "--tool-color": `var(--tool-${t.color})` } as React.CSSProperties}
                  className="font-hud flex items-center gap-2 rounded-full border border-line px-3 py-2 text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:border-[var(--tool-color)] hover:text-[var(--tool-color)]"
                >
                  <ToolIcon tool={t.color} size={18} glow={false} />
                  {t.title}
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      </main>
      <SiteFooter />
    </>
  );
}
