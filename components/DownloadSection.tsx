import Reveal from "./Reveal";

export default function DownloadSection() {
  return (
    <section id="download" className="container-hud py-20">
      <Reveal>
        <div className="grid gap-8 rounded-2xl border border-line-strong bg-bg-panel/70 p-8 md:grid-cols-[1.3fr_1fr] md:p-10">
          <div>
            <span className="font-hud text-xs uppercase tracking-[0.2em] text-phosphor-dim">Delivery ready</span>
            <h2 className="font-display mt-3 text-3xl font-semibold text-ink md:text-4xl">
              Open source on GitHub
            </h2>
            <p className="mt-4 max-w-lg text-muted">
              Next.js, TypeScript, and Tailwind on a single design-token system —
              clean enough to open-source today, structured enough to keep growing.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#tools"
                className="font-hud rounded-md bg-phosphor px-5 py-3 text-xs uppercase tracking-[0.15em] text-[#04140b]"
              >
                Review the tools
              </a>
              <a
                href="https://github.com/Santipap250/FPVCONFIG"
                target="_blank"
                rel="noopener noreferrer"
                className="font-hud rounded-md border border-line-strong px-5 py-3 text-xs uppercase tracking-[0.15em] text-ink transition-colors hover:border-phosphor hover:text-phosphor"
              >
                View on GitHub
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-line px-5 py-4">
              <span className="font-hud text-[11px] uppercase tracking-[0.15em] text-phosphor-dim">
                Repository
              </span>
              <strong className="font-display mt-1 block text-lg text-ink">Santipap250/FPVCONFIG</strong>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line px-4 py-3">
                <strong className="font-display block text-sm text-ink">Stack</strong>
                <p className="mt-1 text-xs text-muted">Next.js · TS · Tailwind</p>
              </div>
              <div className="rounded-xl border border-line px-4 py-3">
                <strong className="font-display block text-sm text-ink">Future path</strong>
                <p className="mt-1 text-xs text-muted">PWA · dashboard · sync</p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
