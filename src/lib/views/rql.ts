export type SearchParamsRecord = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * Escape RQL-special characters in a value so a value like `flu)` or `a,b` cannot
 * break out of its clause. RQL reserves `,`, `(`, `)` — percent-encode them per the
 * BV-BRC convention. Plain alphanumeric values pass through unchanged.
 */
export function escapeRqlValue(value: string): string {
  return value.replace(/,/g, "%2C").replace(/\(/g, "%28").replace(/\)/g, "%29");
}

/** Build a single `eq(field,value)` clause with the value escaped. */
export function rqlEq(field: string, value: string): string {
  return `eq(${field},${escapeRqlValue(value)})`;
}

/** Build a single `keyword(value)` clause with the value escaped. */
export function rqlKeyword(value: string): string {
  return `keyword(${escapeRqlValue(value)})`;
}

/** Combine two or more RQL clauses with `and(...)`. */
export function rqlAnd(...clauses: string[]): string {
  if (clauses.length === 1) return clauses[0];
  return `and(${clauses.join(",")})`;
}

/**
 * Build an RQL string from allow-listed friendly params. `keyword` → keyword(), others → eq().
 * Values are escaped via {@link escapeRqlValue} so user-supplied params cannot corrupt the query.
 */
export function friendlyParamsToRql(
  params: SearchParamsRecord,
  allowed: readonly string[],
): string {
  const clauses: string[] = [];
  for (const name of allowed) {
    const raw = firstValue(params[name]);
    if (raw === undefined || raw === "") continue;
    clauses.push(name === "keyword" ? rqlKeyword(raw) : rqlEq(name, raw));
  }
  if (clauses.length === 0) return "";
  if (clauses.length === 1) return clauses[0];
  return `and(${clauses.join(",")})`;
}

/**
 * Resolve a list view's RQL: explicit ?rql= wins; ?filter= (promoted from legacy
 * hash by LegacyHashAdapter) is the next fallback; otherwise compose friendly params.
 */
export function resolveListQuery(
  params: SearchParamsRecord,
  allowed: readonly string[],
): string {
  const rql = firstValue(params.rql);
  if (rql !== undefined && rql !== "") return rql;
  const filter = firstValue(params.filter);
  if (filter !== undefined && filter !== "" && filter.includes("(")) return filter;
  return friendlyParamsToRql(params, allowed);
}
