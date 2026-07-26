import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import BootSequence from "@/components/BootSequence";
import TrustSection from "@/components/TrustSection";
import ToolsSection from "@/components/ToolsSection";
import DesignSystemSection from "@/components/DesignSystemSection";
import RoadmapSection from "@/components/RoadmapSection";
import FaqSection from "@/components/FaqSection";
import DownloadSection from "@/components/DownloadSection";
import SiteFooter from "@/components/SiteFooter";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export default function Home() {
  return (
    <>
      <BootSequence />
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
