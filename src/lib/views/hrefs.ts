// Centralized internal-URL construction for (views) routes. Keep path shape and
// query encoding here so callers do not hand-build strings (and re-derive encoding
// rules) at each site.

/** Internal taxonomy singular route, e.g. `/taxonomy/561`. */
export function taxonomyHref(taxonId: number | string): string {
  return `/taxonomy/${String(taxonId)}`;
}

/** Return a navigable Genome ID from an API row, if present. */
export function genomeIdFromRow(
  row: Record<string, unknown> | null,
): string | null {
  const genomeId = row?.genome_id;
  return typeof genomeId === "string" || typeof genomeId === "number"
    ? String(genomeId)
    : null;
}

/** Internal genome singular route, e.g. `/genome/83332.12`. */
export function genomeHref(genomeId: number | string): string {
  return `/genome/${encodeURIComponent(String(genomeId))}`;
}

/**
 * Internal genome list route, optionally pre-filtered by a friendly keyword or an
 * RQL string. Explicit RQL takes precedence when both are supplied.
 */
export function genomeListHref(opts?: {
  keyword?: string;
  rql?: string;
}): string {
  if (opts?.rql) return `/genome?rql=${encodeURIComponent(opts.rql)}`;
  if (opts?.keyword) {
    return `/genome?keyword=${encodeURIComponent(opts.keyword)}`;
  }
  return "/genome";
}

/** Return the canonical Feature ID from an API row, falling back for legacy search payloads. */
export function featureIdFromRow(
  row: Record<string, unknown> | null,
): string | null {
  const featureId = row?.feature_id ?? row?.patric_id;
  return typeof featureId === "string" || typeof featureId === "number"
    ? String(featureId)
    : null;
}

/** Internal Feature member route. */
export function featureHref(featureId: number | string): string {
  return `/feature/${encodeURIComponent(String(featureId))}`;
}

/** Canonical Feature list route. Explicit RQL takes precedence over keyword. */
export function featureListHref(opts?: {
  keyword?: string;
  rql?: string;
  filter?: string;
}): string {
  const params: string[] = [];
  if (opts?.rql) params.push(`rql=${encodeURIComponent(opts.rql)}`);
  else if (opts?.keyword) params.push(`keyword=${encodeURIComponent(opts.keyword)}`);
  if (opts?.filter) params.push(`filter=${encodeURIComponent(opts.filter)}`);
  return params.length ? `/feature?${params.join("&")}` : "/feature";
}
