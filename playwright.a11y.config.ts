import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3020);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${String(port)}`;
const isCi = Boolean(process.env.CI);

// Same wrapper as playwright.config.ts — loads .env.e2e.* and starts next start.
const webServerCommand = `node e2e/scripts/start-webserver.mjs ${String(port)}`;

export default defineConfig({
  globalTeardown: "./e2e/a11y/teardown.ts",
  testDir: "./e2e",
  // Only a11y specs — excluded from the main playwright.config.ts via negative lookahead.
  testMatch: /tests\/a11y\/.*\.spec\.ts$/,
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  workers: isCi ? 4 : undefined,
  reporter: isCi
    ? [
        ["github"],
        ["html", { open: "never" }],
        ["json", { outputFile: "a11y-report/results.json" }],
      ]
    : [["list"], ["html", { open: "never" }]],
  outputDir: "a11y-results",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Suppress CSS transitions/animations globally so axe scans stable states.
    contextOptions: { reducedMotion: "reduce" },
  },
  projects: [
    // Auth setup — reuses the same setup scripts as playwright.config.ts.
    // Writes e2e/.auth/user.json used by all a11y projects below.
    {
      name: "a11y-setup-signed-in",
      testMatch: /auth\/signed-in\.setup\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "a11y-setup-public",
      testMatch: /auth\/public\.setup\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },

    // Deep scan: chromium — runs all a11y specs with full dual-theme.
    {
      name: "a11y-chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["a11y-setup-signed-in"],
    },

    // Thin tripwires: webkit + firefox — smoke a representative subset.
    // Specs use test.skip(({ projectName }) => !projectName.includes("tripwire") && ...) for filtering.
    {
      name: "a11y-webkit-tripwire",
      use: {
        ...devices["Desktop Safari"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["a11y-setup-signed-in"],
    },
    {
      name: "a11y-firefox-tripwire",
      use: {
        ...devices["Desktop Firefox"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["a11y-setup-signed-in"],
    },

    // Mobile thin: chromium at Pixel 5 viewport — high-divergence routes only (Phase 3).
    {
      name: "a11y-mobile-chromium",
      use: {
        ...devices["Pixel 5"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["a11y-setup-signed-in"],
    },
  ],
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer: !isCi,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
