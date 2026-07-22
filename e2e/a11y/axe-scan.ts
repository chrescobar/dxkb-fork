import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import type { Violation } from "./gate";

// Full tag set: WCAG 2.1AA (blocking tier) + best-practice + 2.2AA (warn tier). Experimental excluded.
export const coreTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
export const extraTags = ["best-practice", "wcag22aa"];
export const allAxeTags = [...coreTags, ...extraTags];

/**
 * Vendor subtrees excluded from every axe scan.
 * The wrapping element must still carry an accessible name / text alternative (tested separately).
 */
export const vendorExclusions = [
  "[data-molstar-viewer]",
  ".cm-editor",
  "[data-testid='visx-chart'] svg",
  "[data-testid='recharts-wrapper'] svg",
];

export interface ScanOptions {
  /** axe .include() — restrict scan to this CSS selector. */
  include?: string;
  /** Extra selectors excluded beyond vendorExclusions. */
  exclude?: string[];
  /** Override default allAxeTags. */
  tags?: string[];
  /**
   * Disable specific rule IDs entirely (axe won't run them).
   * Prefer baseline suppression; only use this for rules that cannot be run at all
   * (e.g. false-positive vendor internals the exclude selector can't reach).
   */
  disableRules?: string[];
}

/**
 * Scan the page with axe and return raw violations.
 * Applies vendorExclusions automatically.
 */
export async function scanPage(page: Page, options: ScanOptions = {}): Promise<Violation[]> {
  let builder = [...vendorExclusions, ...(options.exclude ?? [])].reduce(
    (b, sel) => b.exclude(sel),
    new AxeBuilder({ page }).withTags(options.tags ?? allAxeTags),
  );

  if (options.include) builder = builder.include(options.include);
  if (options.disableRules?.length) builder = builder.disableRules(options.disableRules);

  const results = await builder.analyze();
  return results.violations;
}

/** Format blocking violations into a human-readable assertion message. */
export function formatBlocking(violations: Violation[], context: string): string {
  const lines = violations.map((v) => {
    const targets = v.nodes
      .slice(0, 3)
      .map((n) => `      ${n.target.join(" ")}`)
      .join("\n");
    return `  - [${v.impact ?? ""}] ${v.id}: ${v.help}\n${targets}`;
  });
  return `${String(violations.length)} blocking a11y violation(s) on ${context}:\n${lines.join("\n")}`;
}

/** Log warn-tier violations without failing the test. */
export function logWarnings(warnings: Violation[], context: string): void {
  if (warnings.length === 0) return;
  const summary = warnings
    .map(
      (v) =>
        `  - [${v.impact ?? "minor"}] ${v.id}: ${v.help} (${String(v.nodes.length)} node${v.nodes.length === 1 ? "" : "s"})`,
    )
    .join("\n");
  console.warn(`[a11y] ${context}: ${String(warnings.length)} warn-tier violation(s):\n${summary}`);
}
