import type { Violation } from "./gate";

export interface BaselineEntry {
  /** Maximum allowed node count — more nodes than this → still blocks. */
  maxNodes: number;
  /** Required ticket reference, e.g. "DXKBCORE-133". Un-ticketed entries fail baseline-lint. */
  ticket: string;
  /** ISO date after which this entry auto-expires and violations block again. */
  expires?: string;
}

/**
 * { route: { theme: { ruleId: entry } } }
 *
 * The special route key "*" is a wildcard: its entries apply to every route that
 * lacks a more-specific entry for the same theme + ruleId combination.
 *
 * Each level is wrapped in `Partial` so optional-chaining (`?.`) is type-valid
 * for sparse key lookups at runtime.
 */
export type BaselineMap = Partial<
  Record<string, Partial<Record<string, Record<string, BaselineEntry>>>>
>;

/** Critical violations may NEVER be baselined (plan §gate). */
export function canBaseline(violation: Violation): boolean {
  return violation.impact !== "critical";
}

function lookupEntry(
  baseline: BaselineMap,
  route: string,
  theme: string,
  ruleId: string,
): BaselineEntry | undefined {
  return baseline[route]?.[theme]?.[ruleId] ?? baseline["*"]?.[theme]?.[ruleId];
}

/** Returns true if the violation is within its baseline budget and should be suppressed. */
export function isBaselined(
  baseline: BaselineMap,
  route: string,
  theme: string,
  violation: Violation,
): boolean {
  if (!canBaseline(violation)) return false;
  const entry = lookupEntry(baseline, route, theme, violation.id);
  if (!entry) return false;
  if (entry.expires && new Date(entry.expires) < new Date()) {
    console.warn(
      `[a11y/baseline] expired: ${route}/${theme}/${violation.id} (${entry.ticket}) — treating as un-baselined`,
    );
    return false;
  }
  return violation.nodes.length <= entry.maxNodes;
}

/**
 * Filter blocking violations through the baseline.
 * Violations exceeding their budget, or with no entry, remain in `remaining`.
 */
export function applyBaseline(
  baseline: BaselineMap,
  route: string,
  theme: string,
  blocking: Violation[],
): { suppressed: Violation[]; remaining: Violation[] } {
  const suppressed: Violation[] = [];
  const remaining: Violation[] = [];
  for (const v of blocking) {
    if (isBaselined(baseline, route, theme, v)) {
      suppressed.push(v);
    } else {
      remaining.push(v);
    }
  }
  return { suppressed, remaining };
}
