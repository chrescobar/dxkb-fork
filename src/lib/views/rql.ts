export type SearchParamsRecord = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Build an RQL string from allow-listed friendly params. `keyword` → keyword(), others → eq(). */
export function friendlyParamsToRql(
  params: SearchParamsRecord,
  allowed: readonly string[],
): string {
  const clauses: string[] = [];
  for (const name of allowed) {
    const raw = firstValue(params[name]);
    if (raw === undefined || raw === "") continue;
    clauses.push(name === "keyword" ? `keyword(${raw})` : `eq(${name},${raw})`);
  }
  if (clauses.length === 0) return "";
  if (clauses.length === 1) return clauses[0];
  return `and(${clauses.join(",")})`;
}

/** Resolve a list view's RQL: explicit ?rql= wins; otherwise compose friendly params. */
export function resolveListQuery(
  params: SearchParamsRecord,
  allowed: readonly string[],
): string {
  const rql = firstValue(params.rql);
  if (rql !== undefined && rql !== "") return rql;
  return friendlyParamsToRql(params, allowed);
}
