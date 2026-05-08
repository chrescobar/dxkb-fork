import { getRequiredEnv } from "@/lib/env";

export const numberFormatter = new Intl.NumberFormat("en-US");

export const organismBvBrcRevalidateSeconds = 86400;
export const organismPubMedRevalidateSeconds = 3600;

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

export function buildGenomeFacetUrl(baseUrl: string, taxonId: number, field: string, limit: number): string {
  return `${baseUrl}/genome/?eq(taxon_lineage_ids,${taxonId})&limit(1)&facet((field,${field}),(limit,${limit}),(mincount,1))`;
}
