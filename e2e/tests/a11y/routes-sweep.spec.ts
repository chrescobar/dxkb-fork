import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  authSessionOverrides,
  workspaceOverrides,
  jobsOverrides,
  permissiveBackendOverrides,
} from "../../fixtures/overrides";
import { awaitSettled } from "../../a11y/settle";
import { scanPage, formatBlocking, logWarnings } from "../../a11y/axe-scan";
import { partition } from "../../a11y/gate";
import type { Violation } from "../../a11y/gate";
import { applyBaseline } from "../../a11y/baseline";
import { forEachTheme } from "../../a11y/theme";
import generatedBaseline, { reflowSkip } from "../../a11y/baseline.generated";
import { isReflowSkipped } from "../../a11y/baseline";
import { recordScan } from "../../a11y/report";
import { routes } from "../../a11y/routes";
import type { BaselineMap } from "../../a11y/baseline";
import type { RouteEntry, RouteVariant } from "../../a11y/routes";
import type { JsonOverride } from "../../mocks/backends";

const baselineMap: BaselineMap = generatedBaseline;

function assertNoBlockingViolations(violations: Violation[], routeKey: string, theme: string): void {
  const { blocking, warnings } = partition(violations);
  const { remaining, suppressed } = applyBaseline(baselineMap, routeKey, theme, blocking);
  logWarnings(warnings, `${routeKey} (${theme})`);
  if (suppressed.length > 0) {
    console.info(`[a11y] ${routeKey} (${theme}): ${String(suppressed.length)} suppressed by baseline`);
  }
  recordScan({ route: routeKey, theme, blocking: remaining, suppressed, warnings });
  expect(
    remaining,
    remaining.length === 0 ? undefined : formatBlocking(remaining, `${routeKey} (${theme})`),
  ).toEqual([]);
}

interface ScanTarget {
  route: RouteEntry;
  name: string;
  path: string;
  prepare?: RouteEntry["prepare"] | RouteVariant["prepare"];
}

// Flatten routes × variants into individual scan targets, skipping redirect-only entries.
const scanTargets: ScanTarget[] = routes.flatMap((route) => {
  if (route.redirectOnly) return [];
  if (!route.variants?.length) {
    return [{ route, name: route.name, path: route.path, prepare: route.prepare }];
  }
  return route.variants.map((v) => ({
    route,
    name: `${route.name}/${v.nameSuffix}`,
    path: v.path,
    prepare: v.prepare ?? route.prepare,
  }));
});

function buildOverrides(route: RouteEntry): JsonOverride[] {
  if (route.unauthenticated) {
    return [
      {
        url: "/api/auth/get-session",
        method: "GET",
        status: 200,
        body: { user: null, session: null },
      } as const,
      ...permissiveBackendOverrides,
    ];
  }
  return [
    ...authSessionOverrides,
    ...(route.needsWorkspace ? workspaceOverrides : []),
    ...(route.needsJobs ? jobsOverrides : []),
    ...permissiveBackendOverrides,
  ];
}

test.describe("a11y route sweep", () => {
  for (const target of scanTargets) {
    test(
      `${target.name} (${target.path}) has no blocking a11y violations`,
      async ({ page, context }, testInfo) => {
        if (testInfo.project.name.includes("tripwire") && !target.route.tripwire) {
          test.skip();
        }
        if (testInfo.project.name.includes("mobile") && !target.route.mobile) {
          test.skip();
        }
        if (target.route.unauthenticated) {
          await context.clearCookies();
        }

        await applyBackendMocks(page, { overrides: buildOverrides(target.route) });
        await page.goto(target.path);
        await awaitSettled(page, target.route.settle);
        await target.prepare?.(page);

        // Dual-theme axe scan (light → dark).
        await forEachTheme(page, async (theme) => {
          const violations = await scanPage(page);
          assertNoBlockingViolations(violations, target.name, theme);
        });

        // WCAG 1.4.10 reflow: no horizontal scroll at 320px viewport width.
        await page.setViewportSize({ width: 320, height: 568 });
        const hasHorizontalScroll = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        );
        if (isReflowSkipped(reflowSkip, target.name)) {
          if (hasHorizontalScroll) {
            const ticket = reflowSkip[target.name]?.ticket ?? "unknown";
            console.warn(
              `[a11y/reflow-skip] ${target.name}: horizontal scroll suppressed (${ticket})`,
            );
          }
        } else {
          expect(
            hasHorizontalScroll,
            `${target.name}: horizontal scroll at 320px viewport — WCAG 1.4.10 reflow failure`,
          ).toBe(false);
        }
      },
    );
  }
});

test.describe("a11y component surfaces", () => {
  // Taxonomy metadata-distributions: component-scoped regression guard.
  // Full-page taxonomy scan runs in the broad sweep above.
  test(
    "taxonomy metadata-distributions has no regression in fixed WCAG rules",
    async ({ page, context }) => {
      await context.clearCookies();
      await applyBackendMocks(page, {
        overrides: [...workspaceOverrides, ...permissiveBackendOverrides],
      });
      await page.goto("/taxonomy/234");

      // The section's <h2> renders synchronously; chart cards stream in after.
      await page
        .getByRole("heading", { level: 2, name: /Metadata Distributions/ })
        .waitFor({ timeout: 10_000 });
      await page.waitForLoadState("networkidle");

      const violations = await scanPage(page, {
        include: '[data-testid="metadata-distributions"]',
      });

      // Regression guard: lock four WCAG rules fixed in DXKBCORE-133.
      const lockedRules = new Set([
        "label-content-name-mismatch", // WCAG 2.5.3 — ChartLegendPill accessible name
        "aria-toggle-field-name",       // WCAG 4.1.2 — aria-pressed legend toggles
        "non-text-contrast",            // WCAG 1.4.11 — swatch 3:1-contrast border
        "heading-order",                // WCAG 1.3.1 — chart card titles promoted to h3
      ]);
      const regressions = violations.filter((v) => lockedRules.has(v.id));
      expect(
        regressions,
        regressions.length === 0
          ? undefined
          : `${String(regressions.length)} WCAG regression(s) in metadata-distributions:\n${regressions
              .map((v) => `  - ${v.id}: ${v.help} (${String(v.nodes.length)} node(s))`)
              .join("\n")}`,
      ).toEqual([]);

      // Standard gate for any other violations in the scoped region.
      assertNoBlockingViolations(violations, "taxonomy-metadata-distributions", "dxkb-light");
    },
  );

  // Command palette interaction state — migrated to deep-tier.spec.ts in Phase 3.
  // Kept here during Phase 2 transition so coverage doesn't regress.
  test("command palette (open) has no blocking a11y violations", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [
        ...authSessionOverrides,
        ...workspaceOverrides,
        ...jobsOverrides,
        ...permissiveBackendOverrides,
      ],
    });
    await page.goto("/jobs");
    await page.waitForLoadState("networkidle");

    const modifierKey = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${modifierKey}+K`);
    const commandPaletteDialog = page.getByRole("dialog", { name: /command palette/i });
    // WebKit on Linux CI intercepts Ctrl+K via its built-in Emacs-style "delete to
    // end of line" shortcut before the keydown reaches the page. Retry with Meta+K
    // (the app listens for event.metaKey || event.ctrlKey) as a fallback.
    try {
      await commandPaletteDialog.waitFor({ state: "visible", timeout: 3_000 });
    } catch {
      await page.keyboard.press("Meta+K");
      await commandPaletteDialog.waitFor({ state: "visible", timeout: 10_000 });
    }
    // The cmdk popover renders into a portal; on WebKit the theme CSS variables
    // can momentarily lag behind the dialog's visibility, causing false-positive
    // color-contrast violations. Waiting for input auto-focus confirms full mount.
    await expect(page.locator('[data-slot="command-input"]')).toBeFocused({ timeout: 5_000 });

    const violations = await scanPage(page);
    assertNoBlockingViolations(violations, "command-palette", "dxkb-light");
  });
});
