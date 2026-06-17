import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";

// Isolated Vitest browser-mode config for a11y primitive isolation.
// Run via: pnpm a11y:primitives
//
// Why browser mode: jsdom cannot compute CSS custom properties (color-contrast
// checks would return false-positives). Real Chromium resolves them correctly.
//
// Excluded from pnpm test (jsdom) and from coverage thresholds.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": new URL("src", import.meta.url).pathname,
      "@public": new URL("public", import.meta.url).pathname,
    },
  },
  test: {
    name: "browser-a11y",
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
    include: ["src/**/__a11y__/*.a11y.test.{ts,tsx}"],
    globals: true,
  },
});
