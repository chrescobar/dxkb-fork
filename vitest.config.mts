import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  css: {
    postcss: {},
  },
  test: {
    globals: true,
    clearMocks: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "e2e/scripts/**/*.{test,spec}.{ts,mts}",
    ],
    // Exclude Playwright specs and their helpers; keep e2e/scripts/ tests in scope.
    exclude: [
      "node_modules",
      ".next",
      "out",
      "build",
      "e2e/tests/**",
      "e2e/auth/**",
      "e2e/mocks/**",
      "e2e/fixtures/**",
      "e2e/__snapshots__/**",
    ],
    css: false,
    pool: "forks",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary", "json"],
      include: [
        "src/lib/**",
        "src/hooks/**",
        "src/contexts/**",
        "src/app/api/**",
        "src/app/services/page.tsx",
      ],
      exclude: [
        "src/**/*.d.ts",
        "src/**/types.ts",
        "src/**/types/**",
        "src/components/ui/**",
      ],
      // Floors are (measured − 1) as of 2026-05-22 (DXKBCORE-150 remediation).
      // Bump these incrementally as new tests raise the measured numbers; never lower them.
      thresholds: {
        lines: 83,
        statements: 81,
        functions: 83,
        branches: 71,
      },
    },
  },
});
