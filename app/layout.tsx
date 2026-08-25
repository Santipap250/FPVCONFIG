import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site";
import BottomNav from "@/components/BottomNav";

// Premium refresh (Aug 2026): swapped the body/display pair for something
// with more personality than the very-default Inter/Space Grotesk combo —
// Plus Jakarta Sans reads warmer at body-copy sizes, Bricolage Grotesque's
// slightly irregular letterforms give headings a more distinctive, designed
// feel at the large sizes this site uses them at (hero, section titles).
// Both come through next/font/google, which self-hosts them at build time
// (Vercel's build has internet; this sandbox doesn't, which is why these
// two use the Google loader instead of manually-converted local .woff2
// files like the mono/Thai fonts below still do).
const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body-face",
  display: "swap",
});

const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display-face",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "./fonts/JetBrainsMono.woff2",
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Neither of the two fonts above include Thai glyphs — without this, Thai
// text (most of this site's copy) silently falls back to whatever Thai
// font the visitor's OS happens to default to, breaking the typography
// system for the majority of the actual content.
const notoSansThai = localFont({
  src: "./fonts/NotoSansThai.woff2",
  variable: "--font-thai",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "OBIXCONFIG FPV — Tuning intelligence for FPV pilots",
    template: "%s — OBIXCONFIG FPV",
  },
  description:
    "OBIXCONFIG FPV is a tuning and build console for FPV pilots — PID guidance, blackbox reading, build matching, and flight readiness in one product-grade toolkit.",
  keywords: [
    "FPV",
    "Betaflight",
    "PID tuning",
    "blackbox analyzer",
    "drone build",
    "FPV rates",
    "OBIXCONFIG",
  ],
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "OBIXCONFIG FPV — Tuning intelligence for FPV pilots",
    description:
      "A tuning and build console for FPV pilots: PID guidance, blackbox reading, build matching, and flight readiness.",
    url: siteUrl,
    siteName: "OBIXCONFIG FPV",
    images: [
      {
        url: "/og-preview.jpg",
        width: 1200,
        height: 630,
        alt: "OBIXCONFIG FPV — tuning console for FPV pilots",
      },
    ],
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OBIXCONFIG FPV",
    description: "Tuning intelligence for FPV pilots.",
    images: ["/og-preview.jpg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OBIXCONFIG FPV",
  },
  verification: {
    google: "Eyh1zNAgmJEbGr52OpkGTmradGijdm7KMIlOex-6ppQ",
  },
};

export const viewport: Viewport = {
  themeColor: "#05070a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${bodyFont.variable} ${displayFont.variable} ${jetbrainsMono.variable} ${notoSansThai.variable}`}>
      <body>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
