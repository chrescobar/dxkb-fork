import { getRequiredEnv } from "@/lib/env";

export const numberFormatter = new Intl.NumberFormat("en-US");

// Shared chart palette. Charts that need fewer colors (e.g. donut → 5 + Others)
// take a `slice()` rather than maintaining their own copy.
export const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
  "var(--chart-9)",
  "var(--chart-10)",
];

export const donutFallbackColor = "var(--muted-foreground)";

export const organismBvBrcRevalidateSeconds = 86400;

export function organismFetchCacheInit(
  revalidateSeconds: number,
): { cache: "no-store" } | { next: { revalidate: number } } {
  if (process.env.E2E_MOCK_ENABLED === "1") {
    return { cache: "no-store" };
  }
  return { next: { revalidate: revalidateSeconds } };
}

export function getBvBrcWebsiteApiBaseUrl(): string {
  return getRequiredEnv("BVBRC_WEBSITE_API_URL").replace(/\/+$/, "");
}

export async function responseErrorMessage(response: Response): Promise<string> {
  const body = await response.text().catch(() => "");
  return body.trim() || `${response.status} ${response.statusText}`.trim();
}

/**
 * Standard SOLR/BV-BRC fetch wrapper. Centralizes Accept header, cache init,
 * error message extraction, and JSON-object validation so callers can stay
 * focused on URL construction and payload parsing.
 */
export async function fetchOrganismSolrJson(
  url: string,
  source: string,
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/solr+json" },
    signal,
    ...organismFetchCacheInit(organismBvBrcRevalidateSeconds),
  });
  if (!response.ok) {
    throw new Error(`${source}: ${await responseErrorMessage(response)}`);
  }
  return readJsonObject(response, source);
}

export async function readJsonObject(response: Response, source: string): Promise<Record<string, unknown>> {
  const payload = (await response.json().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${source}: malformed JSON response: ${message}`);
  })) as unknown;

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error(`${source}: malformed JSON response`);
  }

  return payload as Record<string, unknown>;
}

export function numberOrNull(value: unknown, field: string): number | null {
  if (value === null || value === undefined || value === "") return null;
  // Reject booleans, arrays, and objects up front: `Number(true) === 1`,
  // `Number([5]) === 5`, both pass `Number.isFinite` and silently corrupt data.
  if (typeof value !== "number" && typeof value !== "string") {
    throw new Error(`Unexpected BV-BRC response shape: ${field} is not numeric`);
  }
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error(`Unexpected BV-BRC response shape: ${field} is not numeric`);
  }
  return numeric;
}

export function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Unexpected BV-BRC response shape: ${field} is missing`);
  }
  return value;
}

export function requiredNumber(value: unknown, field: string): number {
  const numeric = numberOrNull(value, field);
  if (numeric === null) {
    throw new Error(`Unexpected BV-BRC response shape: ${field} is missing`);
  }
  return numeric;
}

export function parseSolrFacetList(payload: Record<string, unknown>, field: string): { name: string; count: number }[] {
  const facetCounts = payload.facet_counts;
  if (!facetCounts || typeof facetCounts !== "object" || Array.isArray(facetCounts)) {
    throw new Error(`Unexpected SOLR response shape: missing facet_counts`);
  }

  const facetFields = (facetCounts as Record<string, unknown>).facet_fields;
  if (!facetFields || typeof facetFields !== "object" || Array.isArray(facetFields)) {
    throw new Error(`Unexpected SOLR response shape: missing facet_fields`);
  }

  const rawFacet = (facetFields as Record<string, unknown>)[field];
  if (!Array.isArray(rawFacet)) {
    throw new Error(`Unexpected SOLR response shape: missing ${field} facet`);
  }

  const values: { name: string; count: number }[] = [];
  for (let index = 0; index < rawFacet.length; index += 2) {
    const name = rawFacet[index];
    const count = rawFacet[index + 1];
    if (typeof name !== "string") {
      throw new Error(`Unexpected SOLR response shape: ${field} facet label is invalid`);
    }
    values.push({ name, count: requiredNumber(count, `${field} count`) });
  }

  return values;
}

export function buildGenomeFacetUrl(baseUrl: string, taxonId: number, field: string, limit?: number): string {
  const limitClause = typeof limit === "number" && limit > 0 ? `,(limit,${limit})` : "";
  return `${baseUrl}/genome/?eq(taxon_lineage_ids,${taxonId})&limit(1)&facet((field,${field})${limitClause},(mincount,1))`;
}

export function buildGenomeGeoFacetUrl(baseUrl: string, taxonId: number, field: string, limit?: number): string {
  const limitClause = typeof limit === "number" && limit > 0 ? `,(limit,${limit})` : "";
  return `${baseUrl}/genome/?eq(genome_id,*)&genome(eq(taxon_lineage_ids,${taxonId}))&facet((field,${field}),(mincount,1)${limitClause})&limit(0)`;
}

export function buildGenomeGeoPivotUrl(baseUrl: string, taxonId: number, primary: string, secondary: string, limit?: number): string {
  const limitClause = typeof limit === "number" && limit > 0 ? `,(limit,${limit})` : "";
  return `${baseUrl}/genome/?eq(genome_id,*)&genome(eq(taxon_lineage_ids,${taxonId}))&facet((pivot,(${primary},${secondary})),(mincount,1)${limitClause})&limit(0)`;
}

interface PivotEntry {
  value?: unknown;
  count?: unknown;
  pivot?: unknown;
}

export function parseSolrFacetPivot(payload: Record<string, unknown>, pivotKey: string): Record<string, Record<string, number>> {
  const facetCounts = payload.facet_counts;
  if (!facetCounts || typeof facetCounts !== "object" || Array.isArray(facetCounts)) {
    throw new Error(`Unexpected SOLR response shape: missing facet_counts`);
  }

  const facetPivot = (facetCounts as Record<string, unknown>).facet_pivot;
  if (!facetPivot || typeof facetPivot !== "object" || Array.isArray(facetPivot)) {
    throw new Error(`Unexpected SOLR response shape: missing facet_pivot`);
  }

  const rawPivot = (facetPivot as Record<string, unknown>)[pivotKey];
  if (!Array.isArray(rawPivot)) {
    throw new Error(`Unexpected SOLR response shape: missing ${pivotKey} pivot`);
  }

  const result: Record<string, Record<string, number>> = {};
  for (const entry of rawPivot as PivotEntry[]) {
    if (!entry || typeof entry !== "object") continue;
    // SOLR may emit numeric outer keys (e.g. collection_year) as numbers OR
    // strings depending on field type; coerce to string for the result map.
    let name: string | null = null;
    if (typeof entry.value === "string" && entry.value.length > 0) {
      name = entry.value;
    } else if (typeof entry.value === "number" && Number.isFinite(entry.value)) {
      name = String(entry.value);
    }
    if (name === null) continue;
    const inner: Record<string, number> = {};
    if (Array.isArray(entry.pivot)) {
      for (const sub of entry.pivot as PivotEntry[]) {
        if (!sub || typeof sub !== "object") continue;
        const subName = sub.value;
        const subCount = sub.count;
        if (typeof subName !== "string" || subName.length === 0) continue;
        if (typeof subCount === "number" && Number.isFinite(subCount)) {
          inner[subName] = subCount;
        } else if (typeof subCount === "string") {
          const numeric = Number(subCount);
          if (Number.isFinite(numeric)) inner[subName] = numeric;
        }
      }
    }
    result[name] = inner;
  }
  return result;
}

/**
 * Calculates a fixed-position tooltip style that flips horizontally or
 * vertically when the tooltip would overflow the viewport edge.
 *
 * When flipping horizontally, `right` is returned (instead of `left`) so the
 * tooltip's right edge anchors near the cursor — no width estimation needed.
 *
 * @param cx - cursor clientX
 * @param cy - cursor clientY
 * @param estimatedWidth - estimated tooltip width in px (used only to decide whether to flip)
 * @param estimatedHeight - estimated tooltip height in px
 * @param offsetX - preferred x offset from cursor (positive = right)
 * @param offsetY - preferred y offset from cursor (negative = above)
 */
export function chartTooltipStyle(
  cx: number,
  cy: number,
  estimatedWidth: number,
  estimatedHeight: number,
  offsetX = 12,
  offsetY = -36,
): { left?: number; right?: number; top: number } {
  const vw = typeof window !== "undefined" ? window.innerWidth : 9999;
  const vh = typeof window !== "undefined" ? window.innerHeight : 9999;

  // Flip horizontally: use `right` (viewport-relative) so the tooltip's right
  // edge sits offsetX px from the cursor, regardless of actual tooltip width.
  const flipX = cx + offsetX + estimatedWidth > vw;
  const xStyle = flipX
    ? { right: vw - cx + offsetX }
    : { left: cx + offsetX };

  const top =
    cy + offsetY < 0
      ? cy + Math.abs(offsetY)
      : cy + offsetY + estimatedHeight > vh
        ? cy - Math.abs(offsetY) - estimatedHeight
        : cy + offsetY;

  return { ...xStyle, top };
}
