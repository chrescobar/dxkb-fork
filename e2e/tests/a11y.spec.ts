import AxeBuilder from "@axe-core/playwright";

import { test, expect, applyBackendMocks } from "../mocks/backends";
import {
  authSessionOverrides,
  workspaceOverrides,
  jobsOverrides,
  permissiveBackendOverrides,
} from "../fixtures/overrides";

// Axe tags we want enforced. WCAG 2.1 AA is the practical bar for the suite.
const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// All known violations fixed in DXKBCORE-133. Add IDs back here only with
// linked tickets and a target removal date.
const knownBaselineViolations: string[] = [
  // WebKit-only: axe flags Base UI's internal focus-guard <span> elements
  // (data-base-ui-focus-guard) as ARIA commands without names. The spans are
  // rendered by @base-ui/react Dialog/Command and are not author-controlled.
  // Track removal once Base UI adds aria-hidden / role="none" to focus guards.
  "aria-command-name",
];

interface AxeRoute {
  name: string;
  path: string;
  unauthenticated?: boolean;
  /** Optional setup hook — wait for a specific element/state before running axe. */
  prepare?: (page: import("@playwright/test").Page) => Promise<void>;
}

const routes: AxeRoute[] = [
  {
    name: "home",
    path: "/",
    unauthenticated: true,
    prepare: async (page) => {
      await page.waitForLoadState("networkidle");
    },
  },
  {
    name: "sign-in",
    path: "/sign-in",
    unauthenticated: true,
    prepare: async (page) => {
      // Wait for auth status to resolve so the submit button isn't captured
      // in its transient disabled (loading) state, which trips contrast checks.
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: /sign in/i }).waitFor({ state: "visible" });
    },
  },
  {
    name: "workspace",
    path: "/workspace",
    prepare: async (page) => {
      await page.waitForURL(/\/workspace\/[^/]+\/home/, { timeout: 10_000 });
      await page.getByPlaceholder(/search files/i).waitFor({ timeout: 10_000 });
      // Same as sign-in: ensure refresh button finishes its initial spin so
      // axe doesn't catch it in the disabled (low-contrast) state.
      await page.waitForLoadState("networkidle");
    },
  },
  {
    name: "genome-assembly form",
    path: "/services/genome-assembly",
    prepare: async (page) => {
      await page.waitForLoadState("networkidle");
    },
  },
  {
    name: "jobs",
    path: "/jobs",
    prepare: async (page) => {
      await page.waitForLoadState("networkidle");
    },
  },
];

function summarizeViolations(
  results: { violations: { id: string; impact?: string | null; help: string; nodes: { target: unknown[] }[] }[] },
  routeName: string,
) {
  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  const advisory = results.violations.filter(
    (v) => v.impact !== "serious" && v.impact !== "critical",
  );

  if (advisory.length > 0) {
    const summary = advisory
      .map((v) => `  - [${v.impact ?? "minor"}] ${v.id}: ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? "" : "s"})`)
      .join("\n");
    console.warn(
      `[a11y] ${routeName}: ${advisory.length} non-blocking violation(s):\n${summary}`,
    );
  }

  const blockingSummary = blocking
    .map((v) => {
      const targets = v.nodes
        .slice(0, 3)
        .map((n) => `      ${n.target.join(" ")}`)
        .join("\n");
      return `  - [${v.impact}] ${v.id}: ${v.help}\n${targets}`;
    })
    .join("\n");

  return { blocking, blockingSummary };
}

test.describe("a11y axe sweep", () => {
  for (const route of routes) {
    test(`${route.name} (${route.path}) has no serious or critical violations`, async ({
      page,
      context,
    }) => {
      if (route.unauthenticated) {
        await context.clearCookies();
      }

      const overrides = route.unauthenticated
        ? [
            {
              url: "/api/auth/get-session",
              method: "GET",
              status: 200,
              body: { user: null, session: null },
            } as const,
            ...permissiveBackendOverrides,
          ]
        : [
            ...authSessionOverrides,
            ...workspaceOverrides,
            ...jobsOverrides,
            ...permissiveBackendOverrides,
          ];

      await applyBackendMocks(page, { overrides });
      await page.goto(route.path);
      await route.prepare?.(page);

      const builder = new AxeBuilder({ page })
        .withTags(axeTags)
        .disableRules(knownBaselineViolations);
      const results = await builder.analyze();

      const { blocking, blockingSummary } = summarizeViolations(
        results,
        route.name,
      );
      expect(
        blocking,
        blocking.length === 0
          ? undefined
          : `${blocking.length} blocking a11y violation(s) on ${route.name}:\n${blockingSummary}`,
      ).toEqual([]);
    });
  }

  test("taxonomy overview metadata-distributions are free of fixed WCAG violations", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await applyBackendMocks(page, {
      overrides: [...workspaceOverrides, ...permissiveBackendOverrides],
    });
    await page.goto("/taxonomy/234");

    // The section's <h2> renders synchronously on the server, then the
    // chart cards stream in. Wait for at least one chart to mount so axe
    // doesn't scan an empty grid.
    await page.getByRole("heading", { level: 2, name: /Metadata Distributions/ })
      .waitFor({ timeout: 10_000 });
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .include('[data-testid="metadata-distributions"]')
      .withTags(axeTags)
      .disableRules(knownBaselineViolations)
      .analyze();

    // Lock the four WCAG rules we fixed in this branch. Other violations
    // (if any) elsewhere on the page are caught by the broader sweep.
    // - label-content-name-mismatch: WCAG 2.5.3 (Task 1 — ChartLegendPill accessible name)
    // - aria-toggle-field-name:      WCAG 4.1.2 (Task 2 — aria-pressed legend toggles)
    // - non-text-contrast:           WCAG 1.4.11 (Task 3 — swatch 3:1-contrast border)
    // - heading-order:               WCAG 1.3.1  (Task 5 — chart card titles promoted to h3)
    const blockedRules = new Set([
      "label-content-name-mismatch",
      "aria-toggle-field-name",
      "non-text-contrast",
      "heading-order",
    ]);
    const regressions = results.violations.filter((v) =>
      blockedRules.has(v.id),
    );
    expect(
      regressions,
      regressions.length === 0
        ? undefined
        : `${regressions.length} WCAG regression(s) in metadata-distributions:\n${regressions
            .map((v) => `  - ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
            .join("\n")}`,
    ).toEqual([]);
  });

  test("command palette (open) has no serious or critical violations", async ({
    page,
  }) => {
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
    await page.getByRole("dialog", { name: /command palette/i }).waitFor({
      state: "visible",
      timeout: 10_000,
    });
    // The cmdk popover renders into a portal; on webkit the theme CSS
    // variables can momentarily lag behind the dialog's visibility state,
    // causing axe to scan with the wrong --popover-foreground and report
    // false-positive color-contrast violations. Waiting for the input to
    // receive auto-focus confirms cmdk is fully mounted and styled.
    await expect(page.locator('[data-slot="command-input"]')).toBeFocused({
      timeout: 5_000,
    });

    const builder = new AxeBuilder({ page })
      .withTags(axeTags)
      .disableRules(knownBaselineViolations);
    const results = await builder.analyze();

    const { blocking, blockingSummary } = summarizeViolations(
      results,
      "command-palette",
    );
    expect(
      blocking,
      blocking.length === 0
        ? undefined
        : `${blocking.length} blocking a11y violation(s) on command palette:\n${blockingSummary}`,
    ).toEqual([]);
  });
});
