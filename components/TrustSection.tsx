import Reveal from "./Reveal";

const proofs = [
  {
    label: "Real formula",
    title: "Actual Rates, the same math Betaflight uses",
    copy: "Rates Visualizer reimplements Betaflight's own Actual Rates curve — not an approximation.",
  },
  {
    label: "Real signal processing",
    title: "FFT-based noise spectrum",
    copy: "Blackbox Analyzer runs a real Cooley-Tukey FFT on your log, not a rough proxy — verified against known-frequency test signals.",
  },
  {
    label: "Real physics",
    title: "Power-to-weight from electrical draw",
    copy: "Build Helper computes watts-per-gram from actual voltage × current, not guessed thrust numbers with no data behind them.",
  },
  {
    label: "Verified accessible",
    title: "0 violations, WCAG 2A/2AA",
    copy: "Every page audited with axe-core — the same engine Lighthouse uses for accessibility scoring.",
  },
];

export default function TrustSection() {
  return (
    <section className="container-hud py-16">
      <Reveal>
        <span className="font-hud text-xs uppercase tracking-[0.2em] text-phosphor-dim">Proof, not promises</span>
        <h2 className="font-display mt-3 max-w-xl text-2xl font-semibold text-ink md:text-3xl">
          ทุกตัวเลขในเว็บนี้อธิบายที่มาได้
        </h2>
      </Reveal>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {proofs.map((proof, i) => (
          <Reveal key={proof.title} delay={i * 60}>
            <article className="h-full rounded-xl border border-line px-5 py-5">
              <span className="font-hud text-[11px] uppercase tracking-[0.15em] text-phosphor">{proof.label}</span>
              <h3 className="font-display mt-2 text-sm font-medium leading-snug text-ink">{proof.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">{proof.copy}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
