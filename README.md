# OBIXCONFIG FPV

Tuning and build console for FPV pilots — PID guidance, blackbox reading,
build matching, rates visualization, flight readiness, and smart presets,
under one shared design system.

## Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 (CSS-token based theme, see `app/globals.css`)
- Fonts: Plus Jakarta Sans (body) + Bricolage Grotesque (display/headings) via `next/font/google` (self-hosted automatically at build time, no runtime Google Fonts request — swapped from Inter/Space Grotesk on Aug 25, 2026 for a more distinctive premium look); JetBrains Mono (HUD labels) + Noto Sans Thai self-hosted as WOFF2 (converted from TTF on Aug 9, 2026 — see "Performance" below)
- Manual PWA: `public/manifest.webmanifest` + `public/sw.js`, registered from `components/ServiceWorkerRegister.tsx`
- Vitest for unit tests on the calculation-heavy `lib/` modules

## Structure
```
app/
  layout.tsx          root layout, fonts, metadata
  page.tsx             landing page composition + JSON-LD (Organization/WebSite/WebApplication/FAQPage)
  globals.css          design tokens (OSD/telemetry theme) + ambient background animation
  robots.ts            robots.txt (Next.js metadata route)
  sitemap.ts           sitemap.xml, generated from lib/tools.ts
  icon.svg             favicon (Next.js file convention)
  tools/[slug]/page.tsx  per-tool page — renders the real tool component when one exists
                          (see implementedTools map), plus BreadcrumbList JSON-LD
components/            landing sections + shared UI (Reveal, HudPanel, SiteHeader, ...)
                        + the working tool components themselves (PidAdvisorTool,
                        BlackboxAnalyzerTool, RatesVisualizerTool, BuildHelperTool,
                        FlightReadinessTool, SmartPresetsTool)
lib/tools.ts            single source of truth for all 6 tools (fixes original's
                         HTML/JS duplication — landing grid, detail panel, and
                         /tools/[slug] pages all read from here)
lib/faq.ts               single source of truth for FAQ content (FaqSection UI + FAQPage JSON-LD)
lib/structuredData.ts    JSON-LD builders (Organization, WebSite, WebApplication, FAQPage, Breadcrumb)
lib/blackboxAnalyzer.ts  CSV blackbox parsing — real FFT, tracking error, motor sat., battery sag
lib/blackboxHeader.ts    raw .bbl header-only parsing (firmware/PID/rates/filter) — see note below
lib/_tests_/             vitest unit tests for the calculation-heavy lib/ modules
public/                  manifest, service worker, icons, og image
```

## Run locally
```bash
npm install
npm run dev       # http://localhost:3000
```

## Verify before shipping
```bash
npx tsc --noEmit
npx eslint .
npm run build
npm run test
```
All four pass as of this delivery. `npm run build` statically generates the
landing page and all 6 tool pages. `npm run test` runs the vitest suite
covering `lib/` calculation logic (FFT, PID advisor, blackbox parsing/header,
build helper, rates engine, presets, share encoding).

Note: `npm run build` uses Turbopack by default, which doesn't support
Android/arm64 (e.g. building inside Termux). Use `npx next build --webpack`
on that platform — it's not needed on Vercel, macOS, Windows, or regular
Linux.

## Accessibility testing (axe-core)
**Update (Aug 8, 2026):** ran Lighthouse (mobile, via PageSpeed Insights —
which uses an axe-core subset, ~50 of its ~96 rules) by hand against **all
13 routes**. All scored 100/100 Accessibility. One real issue was found and
fixed along the way: `FlightReadinessTool.tsx` had category headings at
`<h3>` with no `<h2>` in between the page's `<h1>` and them — a heading-order
violation (axe rule `heading-order`), not just an "assess by hand" item.
That's what the homepage "Proof, not promises" card and Roadmap Phase 3 now
claim — 13/13 routes, Lighthouse subset, not yet the full axe-core rule set.

The full local suite below still hasn't been run (this sandbox couldn't
install a browser to run it) — running it is what would justify claiming
*full* axe-core coverage across *all* routes:
```bash
npx playwright install --with-deps chromium   # one-time setup
npm run test:a11y
```
This runs axe-core (via `@axe-core/playwright`) against every route in the
sitemap, checking WCAG 2A/2AA, with the full ~96-rule set rather than
Lighthouse's ~50-rule subset. If you run it and it passes, update the
TrustSection/RoadmapSection copy to say "13/13 routes, full axe-core"
instead of "13/13 routes, Lighthouse". If anything fails, fix that before
changing the copy — don't widen the claim before the run backs it up.
That's the mistake that put an unverified "0 violations" claim on the
homepage in the first place.

## Deploy (Vercel)
Repo: https://github.com/Santipap250/FPVCONFIG

Vercel auto-detects Next.js — no custom build/start commands needed.
- Push to the connected GitHub repo, Vercel builds and deploys automatically.
- The app is fully static (no API routes), so this deploys as a static/edge site.
- Set `NEXT_PUBLIC_SITE_URL` in the Vercel project's Environment Variables to the
  production domain, so `robots.ts`/`sitemap.ts` generate correct absolute URLs.

## Honest status of each tool
All 6 tools are real, working, implemented components — not mockups or
placeholder status pages. PID Advisor, Flight Readiness, Build Helper, Rates
Visualizer, and Smart Presets are `live`; Blackbox Analyzer is `beta` (see
below — it has a real, disclosed gap, not just unproven reliability).
`/tools/[slug]` pages state each tool's real status plainly. Build Helper,
Rates Visualizer, and Smart Presets were promoted from beta after a review
confirmed: no undisclosed missing functionality, full test coverage of the
core calculations, and Smart Presets/Rates Visualizer share the same
calculation engines as the already-live PID Advisor rather than duplicating
logic.

**Blackbox Analyzer specifically:** full noise/tracking-error analysis works
today for CSV exported from Blackbox Explorer / `blackbox_decode`. Raw `.bbl`
files can be uploaded too, but only the ASCII header block is read (firmware,
PID, rates, filter settings logged at flight time) — decoding the binary
gyro/motor frame data needs real sample `.bbl` files to validate the
predictor/encoding logic against, so it isn't attempted blind. See
`lib/blackboxHeader.ts` for the reasoning.

## What changed vs. the original static repo
- Single-page static HTML/CSS/JS (9 files, no routing, no build step) →
  Next.js app with real per-tool routes, static generation, and metadata.
- Tool content was duplicated between `index.html` and `app.js` → now lives
  once in `lib/tools.ts`.
- No PNG icons (SVG-only manifest, would fail install on several Android/iOS
  versions) → generated 192/512/maskable PNGs from the source mark.
- Orphaned, unused `style.css` (leftover dead file, unrelated card/button
  styles never linked from `index.html`) → removed.
- Mobile menu open/close was manual DOM attribute toggling → React state.
- No SEO files → `robots.ts`, `sitemap.ts`, JSON-LD structured data, and
  per-route canonical URLs added.

## Performance
**Update (Aug 9, 2026):** fonts were TTF (~406 KB total across Inter, Space
Grotesk, JetBrains Mono, Noto Sans Thai), loaded on every single page via the
root layout. TTF doesn't compress well for web delivery — WOFF2 uses a
font-specific compression algorithm that typically cuts 30-60% off the same
glyph data with zero visual difference. Converted all four (needs the
`brotli` Python package, which needs network access this sandbox didn't
have — done externally and the `.woff2` files brought back in): **~406 KB →
~175 KB, a 57% reduction**, applied globally.

This was diagnosed as the likely cause of `/about` scoring inconsistently on
Lighthouse Performance (70-95 across runs) despite that page having no heavy
JS or images — the page's `<h1>` is Thai text, and Inter/Space
Grotesk/JetBrains Mono have no Thai glyphs, so Noto Sans Thai was very
likely the actual LCP-blocking font on that page (and on most others, since
this is a Thai-primary site).

Not fixed as part of this: `three.js` (used only by the homepage's
`DroneScene`/`HudPanel`, and already code-split via `next/dynamic({ ssr:
false })` — so it shouldn't be affecting other pages already).

## Roadmap
Phase 1–3 (foundation, redesign, 6 real tools with actual math behind them,
raw `.bbl` header parsing, step response analysis, accessibility fixes
verified via Lighthouse 100/100 across all 13 routes) are shipped. Phase 4,
in progress:
- Pending: raw `.bbl` binary frame decoding (full noise/tracking-error graphs
  from a raw log, no CSV export needed) — blocked on real sample files to
  test the decoder against
- Pending: full axe-core suite via Playwright (`e2e/a11y.spec.ts` exists,
  needs a machine that can install a browser — Lighthouse's accessibility
  checks are an axe-core subset, not the full ~96-rule set)
- Pending: features driven by real pilot feedback

Auth and cloud sync are intentionally *not* on the roadmap yet — the app is
local-first by design (all saved data lives in the browser's localStorage),
not an oversight to be fixed later.
