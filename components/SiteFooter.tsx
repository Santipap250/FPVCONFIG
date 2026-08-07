import Link from "next/link";
import Image from "next/image";
import { siteHost } from "@/lib/site";

const toolColors = ["pid", "blackbox", "build", "rates", "flight", "presets"] as const;

export default function SiteFooter() {
  return (
    <footer className="border-t border-line py-8">
      <div className="container-hud flex flex-col gap-6">
        <div className="flex items-center gap-1" aria-hidden="true">
          {toolColors.map((c) => (
            <span key={c} className="h-1 w-8 rounded-full opacity-70" style={{ background: `var(--tool-${c})` }} />
          ))}
        </div>

        <div className="flex flex-col gap-4 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Image src="/brand/obix-symbol.png" alt="" width={34} height={20} className="h-5 w-5 object-contain opacity-90" />
            <p>© {new Date().getFullYear()} OBIXCONFIG FPV — built for pilots, creators, and future app expansion.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about" className="font-hud uppercase tracking-[0.15em] hover:text-phosphor">
              About
            </Link>
            <Link href="/roadmap" className="font-hud uppercase tracking-[0.15em] hover:text-phosphor">
              Roadmap
            </Link>
            <Link href="/faq" className="font-hud uppercase tracking-[0.15em] hover:text-phosphor">
              FAQ
            </Link>
            <Link href="/settings" className="font-hud uppercase tracking-[0.15em] hover:text-phosphor">
              Settings
            </Link>
            <p className="font-hud uppercase tracking-[0.15em]">{siteHost}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-4 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p className="font-hud uppercase tracking-[0.15em] text-phosphor-dim">Contact</p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.facebook.com/banmysanti"
              target="_blank"
              rel="noopener noreferrer"
              className="font-hud flex items-center gap-1.5 uppercase tracking-[0.15em] hover:text-phosphor"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" />
              </svg>
              Facebook Page
            </a>
            <a
              href="https://www.facebook.com/santipab.songkarak"
              target="_blank"
              rel="noopener noreferrer"
              className="font-hud flex items-center gap-1.5 uppercase tracking-[0.15em] hover:text-phosphor"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" />
              </svg>
              ผู้พัฒนา
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
