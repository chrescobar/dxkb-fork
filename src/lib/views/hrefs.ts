// Centralized internal-URL construction for (views) routes. Keep path shape and
// query encoding here so callers do not hand-build strings (and re-derive encoding
// rules) at each site.

/** Internal taxonomy singular route, e.g. `/taxonomy/561`. */
export function taxonomyHref(taxonId: number | string): string {
  return `/taxonomy/${String(taxonId)}`;
}

/**
 * Internal genome list route, optionally pre-filtered by an RQL string. The RQL is
 * URL-encoded once as the `rql` query value; build the RQL itself with the helpers
 * in `rql.ts` (e.g. `rqlEq`) so RQL-special characters are escaped first.
 */
export function genomeListHref(opts?: { rql?: string }): string {
  if (!opts?.rql) return "/genome";
  return `/genome?rql=${encodeURIComponent(opts.rql)}`;
}
