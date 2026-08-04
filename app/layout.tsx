import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { siteUrl } from "@/lib/site";
import AnimatedBackground from "@/components/AnimatedBackground";
import BottomNav from "@/components/BottomNav";

const inter = localFont({
  src: "./fonts/Inter.ttf",
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = localFont({
  src: "./fonts/SpaceGrotesk.ttf",
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "./fonts/JetBrainsMono.ttf",
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Inter / Space Grotesk / JetBrains Mono don't include Thai glyphs — without
// this, Thai text (most of this site's copy) silently falls back to
// whatever Thai font the visitor's OS happens to default to, breaking the
// typography system for the majority of the actual content.
const notoSansThai = localFont({
  src: "./fonts/NotoSansThai.ttf",
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
    <html lang="th" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${notoSansThai.variable}`}>
      <body>
        <AnimatedBackground />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
