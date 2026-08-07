import Reveal from "./Reveal";
import HudPanel from "./HudPanel";

export default function Hero() {
  return (
    <section id="home" className="container-hud grid gap-10 pt-14 pb-20 md:grid-cols-2 md:items-center md:pt-20">
      <Reveal>
        <span className="font-hud inline-block rounded-full border border-line-strong px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-phosphor">
          Tuning console for FPV pilots
        </span>
        <h1 className="font-display mt-5 leading-[1.1] tracking-tight">
          <span className="hero-line hero-line-1 font-hud block text-lg font-medium uppercase tracking-[0.12em] text-phosphor sm:text-xl">
            Turn data into performance
          </span>
          <span className="hero-line hero-line-2 hero-shimmer mt-1 block text-4xl font-semibold text-ink md:text-5xl">
            Your drone can do more.
          </span>
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
          OBIXCONFIG FPV turns PID tuning, blackbox logs, and build matching into
          the same clear, instrument-panel language you already read in goggles.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/dashboard"
            className="font-hud rounded-md bg-phosphor px-5 py-3 text-xs uppercase tracking-[0.15em] text-[#04140b] transition-transform hover:scale-[1.02]"
          >
            Open dashboard
          </a>
          <a
            href="#tools"
            className="font-hud rounded-md border border-line-strong px-5 py-3 text-xs uppercase tracking-[0.15em] text-ink transition-colors hover:border-phosphor hover:text-phosphor"
          >
            Explore tools
          </a>
        </div>

        <dl className="font-hud mt-10 grid grid-cols-2 gap-4 text-xs uppercase tracking-[0.15em] text-muted sm:grid-cols-4">
          <div>
            <dt>Mobile-first</dt>
            <dd className="mt-1 text-lg normal-case tracking-normal text-ink">100%</dd>
          </div>
          <div>
            <dt>App-ready</dt>
            <dd className="mt-1 text-lg normal-case tracking-normal text-ink">PWA</dd>
          </div>
          <div>
            <dt>Grounded in</dt>
            <dd className="mt-1 text-lg normal-case tracking-normal text-ink">Physics</dd>
          </div>
          <div>
            <dt>Built for</dt>
            <dd className="mt-1 text-lg normal-case tracking-normal text-ink">Pilots</dd>
          </div>
        </dl>

        <div className="mt-6 flex items-center gap-2" aria-hidden="true">
          {(["pid", "blackbox", "build", "rates", "flight", "presets"] as const).map((c) => (
            <span
              key={c}
              className="h-2 w-6 rounded-full opacity-80"
              style={{ background: `var(--tool-${c})` }}
            />
          ))}
          <span className="font-hud ml-2 text-[10px] uppercase tracking-[0.2em] text-muted">6 instruments</span>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-10 -z-10 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, var(--phosphor), transparent), radial-gradient(closest-side at 70% 80%, var(--tool-blackbox), transparent)",
            }}
          />
          <HudPanel />
        </div>
      </Reveal>
    </section>
  );
}
