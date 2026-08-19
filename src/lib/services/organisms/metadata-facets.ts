import type { OrganismFetchOptions, OrganismMetadataFacets } from "./types";
import {
  buildGenomeFacetUrl,
  fetchOrganismSolrJson,
  getBvBrcWebsiteApiBaseUrl,
  parseSolrFacetList,
} from "./utils";

async function fetchMetadataFacet(
  baseUrl: string,
  taxonId: number,
  field: string,
  limit: number | undefined,
  signal: AbortSignal | undefined,
) {
  const payload = await fetchOrganismSolrJson(
    buildGenomeFacetUrl(baseUrl, taxonId, field, limit),
    `genome ${field} facet`,
    signal,
  );
  return parseSolrFacetList(payload, field);
}

export async function fetchOrganismMetadataFacets(
  taxonId: number,
  fields: string[],
  options: OrganismFetchOptions & { limit?: number } = {},
): Promise<OrganismMetadataFacets> {
  const baseUrl = getBvBrcWebsiteApiBaseUrl();
  const defaultLimit = options.limit ?? 12;
  const settled = await Promise.allSettled(
    fields.map((field) =>
      fetchMetadataFacet(
        baseUrl,
        taxonId,
        field,
        field === "collection_year" ? undefined : defaultLimit,
        options.signal,
      ),
    ),
  );

  const failed = settled.find((result) => result.status === "rejected");
  if (failed?.status === "rejected") {
    throw failed.reason;
  }

  return fields.reduce<OrganismMetadataFacets>((facets, field, index) => {
    const result = settled[index];
    if (result.status === "fulfilled") {
      facets[field] = result.value;
    }
    return facets;
  }, {});
}
