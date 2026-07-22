import type { OrganismFetchOptions, OrganismGenusFacet } from "./types";
import {
  buildGenomeFacetUrl,
  fetchOrganismSolrJson,
  getBvBrcWebsiteApiBaseUrl,
  parseSolrFacetList,
} from "./utils";

export async function fetchTaxonomicDistribution(
  taxonId: number,
  options: OrganismFetchOptions = {},
): Promise<{ genus: OrganismGenusFacet[]; species: OrganismGenusFacet[] }> {
  const baseUrl = getBvBrcWebsiteApiBaseUrl();
  const limit = 12;

  const [genusResult, speciesResult] = await Promise.allSettled([
    fetchOrganismSolrJson(
      buildGenomeFacetUrl(baseUrl, taxonId, "genus", limit),
      "taxonomic distribution genus",
      options.signal,
    ),
    fetchOrganismSolrJson(
      buildGenomeFacetUrl(baseUrl, taxonId, "species", limit),
      "taxonomic distribution species",
      options.signal,
    ),
  ]);

  if (genusResult.status === "rejected") throw genusResult.reason;
  if (speciesResult.status === "rejected") throw speciesResult.reason;

  return {
    genus: parseSolrFacetList(genusResult.value, "genus"),
    species: parseSolrFacetList(speciesResult.value, "species"),
  };
}
