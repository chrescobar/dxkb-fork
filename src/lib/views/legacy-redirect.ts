import { legacyToSegment, viewRegistry } from "./view-registry";
import type { ViewTypeEntry } from "./view-types";

export interface MappedPath {
  pathname: string;
  search: string;
}

/**
 * Map a legacy BV-BRC /view/* request (path + raw query string, no leading "?")
 * to the new schema. Returns null if the path is not a mappable /view/* URL.
 * Hash is intentionally NOT handled here (the server cannot read it).
 */
export function mapLegacyViewPath(pathname: string, rawSearch: string): MappedPath | null {
  const parts = pathname.split("/").filter(Boolean); // ["view", "Genome", "59201.7581"]
  if (parts.length < 2 || parts[0] !== "view") return null;

  const legacyName = parts[1];
  const segment = legacyToSegment[legacyName];
  if (!segment) return null;

  const entry = viewRegistry[segment as keyof typeof viewRegistry] as ViewTypeEntry;
  const idParts = parts.slice(2); // remaining path segments after the view name
  const isList = entry.legacyList !== undefined && legacyName === entry.legacyList;

  if (isList || idParts.length === 0) {
    // List view: the legacy raw query string may be raw RQL, named params, or a mix
    // (e.g. "eq(genome_id,83332.12)&filter=%22CDS%22"). Split on & and classify each
    // segment individually so named params like filter= are not swallowed into rql=.
    if (!rawSearch) return { pathname: `/${segment}`, search: "" };
    const rqlParts: string[] = [];
    const namedParts: string[] = [];
    for (const seg of rawSearch.split("&")) {
      if (!seg) continue;
      if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(seg)) {
        namedParts.push(seg);
      } else {
        rqlParts.push(seg);
      }
    }
    const searchParts: string[] = [];
    if (rqlParts.length > 0) {
      // encodeURIComponent keeps RQL parens literal and only encodes the comma,
      // which round-trips cleanly and stays readable.
      searchParts.push(`rql=${encodeURIComponent(rqlParts.join("&"))}`);
    }
    if (namedParts.length > 0) {
      searchParts.push(new URLSearchParams(namedParts.join("&")).toString());
    }
    return { pathname: `/${segment}`, search: searchParts.join("&") };
  }

  // Singular view: keep the id in the path, preserve named query params verbatim.
  const id = idParts.join("/");
  const search = rawSearch ? new URLSearchParams(rawSearch).toString() : "";
  return { pathname: `/${segment}/${id}`, search };
}
