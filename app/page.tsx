import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import TrustSection from "@/components/TrustSection";
import ToolsSection from "@/components/ToolsSection";
import DesignSystemSection from "@/components/DesignSystemSection";
import RoadmapSection from "@/components/RoadmapSection";
import FaqSection from "@/components/FaqSection";
import DownloadSection from "@/components/DownloadSection";
import SiteFooter from "@/components/SiteFooter";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import {
  jsonLdScript,
  organizationJsonLd,
  websiteJsonLd,
  webApplicationJsonLd,
  faqPageJsonLd,
} from "@/lib/structuredData";

// The other routes each set their own `alternates.canonical`; the home
// page didn't have a metadata export at all before, so canonical was never
// declared for "/" specifically — it just inherited the root layout's
// defaults with no explicit self-reference.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      {/* Structured data for the home page: describes the org, the site,
          the app itself, and the FAQ shown below in FaqSection. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(organizationJsonLd())} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(websiteJsonLd())} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(webApplicationJsonLd())} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(faqPageJsonLd())} />

      <ServiceWorkerRegister />
      <SiteHeader />
      <main>
        <Hero />
        <TrustSection />
        <ToolsSection />
        <DesignSystemSection />
        <RoadmapSection />
        <FaqSection />
        <DownloadSection />
      </main>
      <SiteFooter />
    </>
  );
}
