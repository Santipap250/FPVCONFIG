import { siteUrl } from "@/lib/site";
import { faqs } from "@/lib/faq";
import { tools } from "@/lib/tools";

const siteName = "OBIXCONFIG FPV";
const logoUrl = `${siteUrl}/brand/obix-symbol.png`;
const facebookPageUrl = "https://www.facebook.com/banmysanti";
const repositoryUrl = "https://github.com/Santipap250/FPVCONFIG";

/**
 * Serializes a JSON-LD object for use in a <script type="application/ld+json">
 * tag. Escapes "<" so the payload can never prematurely close the script
 * element or inject markup — safe to use with dangerouslySetInnerHTML.
 */
export function jsonLdScript(data: object): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: logoUrl,
    sameAs: [facebookPageUrl],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    inLanguage: "th",
  };
}

export function webApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteName,
    url: siteUrl,
    description:
      "OBIXCONFIG FPV is a tuning and build console for FPV pilots — PID guidance, blackbox reading, build matching, and flight readiness in one product-grade toolkit.",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (installable web app / PWA)",
    inLanguage: "th",
    isAccessibleForFree: true,
    codeRepository: repositoryUrl,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: tools.map((tool) => tool.title),
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
  };
}

export function faqPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

/** Home > Tools > {tool name} breadcrumb, for /tools/[slug] pages. */
export function toolBreadcrumbJsonLd(toolTitle: string, toolSlug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tools",
        item: `${siteUrl}/#tools`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: toolTitle,
        item: `${siteUrl}/tools/${toolSlug}`,
      },
    ],
  };
}
