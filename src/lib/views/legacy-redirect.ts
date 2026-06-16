import { legacyToSegment, viewRegistry } from "./view-registry";

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

  const entry = viewRegistry[segment as keyof typeof viewRegistry];
  const idParts = parts.slice(2); // remaining path segments after the view name
  const isList = legacyName === entry.legacyList;

  if (isList || idParts.length === 0) {
    // List view: the legacy raw query string is an RQL expression (if present).
    if (!rawSearch) return { pathname: `/${segment}`, search: "" };
    // If it already looks like key=value named params, pass through; else treat as RQL.
    const looksNamed = /^[A-Za-z_][A-Za-z0-9_]*=/.test(rawSearch);
    if (looksNamed) {
      return { pathname: `/${segment}`, search: new URLSearchParams(rawSearch).toString() };
    }
    // encodeURIComponent (not URLSearchParams) keeps RQL parens literal and only
    // encodes the comma, which round-trips cleanly and stays readable.
    return { pathname: `/${segment}`, search: `rql=${encodeURIComponent(rawSearch)}` };
  }

  // Singular view: keep the id in the path, preserve named query params verbatim.
  const id = idParts.join("/");
  const search = rawSearch ? new URLSearchParams(rawSearch).toString() : "";
  return { pathname: `/${segment}/${id}`, search };
}
