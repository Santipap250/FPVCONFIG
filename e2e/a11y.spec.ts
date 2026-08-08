import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Every route the sitemap lists (lib/tools.ts + the static pages under app/).
// Kept as a plain list rather than importing lib/tools.ts — this file runs
// under Playwright's own transform, not Next's, so keeping it dependency-free
// avoids path-alias/config drift between the two. If a tool is added or
// renamed in lib/tools.ts, add its route here too.
const ROUTES = [
  "/",
  "/about",
  "/dashboard",
  "/download",
  "/faq",
  "/roadmap",
  "/settings",
  "/tools/pid",
  "/tools/blackbox",
  "/tools/build",
  "/tools/rates",
  "/tools/flight",
  "/tools/presets",
];

for (const route of ROUTES) {
  test(`${route} has no WCAG 2A/2AA violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

    // On failure, this prints exactly which rule failed, on which element,
    // and why — enough to fix without re-running with extra flags.
    const details = results.violations
      .map((v) => `- [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} element(s))\n  ${v.helpUrl}`)
      .join("\n");

    expect(results.violations, details).toEqual([]);
  });
}
