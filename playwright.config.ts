import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:3000",
  },
  // `next dev` is fine for iterating locally. Before trusting a "0 violations"
  // claim enough to put it back on the homepage, run once against a
  // production build instead — dev-mode extras (fast refresh overlay, etc.)
  // can behave slightly differently:
  //   npm run build && npm run start &
  //   npx playwright test
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
