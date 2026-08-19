import { test, expect } from "@playwright/test";
import { glob } from "node:fs/promises";
import path from "node:path";
import { coveredPageFiles } from "../../a11y/routes";

// Resolve the src/app directory relative to the repo root.
const appDir = path.resolve(process.cwd(), "src/app");

test.describe("a11y coverage accounting", () => {
  test("every src/app page.tsx is scanned, aliased, or redirectOnly", async () => {
    // Glob all page.tsx files in src/app/ and normalize to paths relative to src/app.
    const pageFiles: string[] = [];
    for await (const file of glob("**/page.tsx", { cwd: appDir })) {
      pageFiles.push(file.replaceAll("\\", "/"));
    }

    expect(pageFiles.length, "expected to find page.tsx files in src/app").toBeGreaterThan(0);

    const uncovered = pageFiles.filter((f) => !coveredPageFiles.has(f));

    expect(
      uncovered,
      uncovered.length === 0
        ? undefined
        : `${String(uncovered.length)} page.tsx file(s) not accounted for in routes.ts.\n` +
          `Add them to the routes[] array or coveredPageFiles in e2e/a11y/routes.ts:\n` +
          uncovered.map((f) => `  - src/app/${f}`).join("\n"),
    ).toEqual([]);
  });

  test("coveredPageFiles has no phantom entries absent from src/app", async () => {
    // Invert check: every entry in coveredPageFiles must exist on disk.
    const pageFiles = new Set<string>();
    for await (const file of glob("**/page.tsx", { cwd: appDir })) {
      pageFiles.add(file.replaceAll("\\", "/"));
    }

    const phantoms = [...coveredPageFiles].filter((f) => !pageFiles.has(f));

    expect(
      phantoms,
      phantoms.length === 0
        ? undefined
        : `${String(phantoms.length)} entry/entries in coveredPageFiles no longer exist in src/app.\n` +
          `Remove them from e2e/a11y/routes.ts coveredPageFiles:\n` +
          phantoms.map((f) => `  - ${f}`).join("\n"),
    ).toEqual([]);
  });
});
