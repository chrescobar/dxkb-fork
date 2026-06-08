import type { OrganismFetchOptions, OrganismGenusFacet } from "./types";
import {
  buildGenomeFacetUrl,
  fetchOrganismSolrJson,
  getBvBrcWebsiteApiBaseUrl,
  parseSolrFacetList,
} from "./utils";

export const hcLevels = [
  "hc0", "hc2", "hc5", "hc10", "hc20", "hc50", "hc100",
] as const;

export type HcLevel = (typeof hcLevels)[number];
export type CgmlstHcDistribution = Record<HcLevel, OrganismGenusFacet[]>;

export async function fetchCgmlstHcDistribution(
  taxonId: number,
  options: OrganismFetchOptions = {},
): Promise<CgmlstHcDistribution> {
  const baseUrl = getBvBrcWebsiteApiBaseUrl();

  const results = await Promise.allSettled(
    hcLevels.map((level) =>
      fetchOrganismSolrJson(
        buildGenomeFacetUrl(baseUrl, taxonId, `cgmlst_${level}`, 10),
        `cgMLST ${level} distribution`,
        options.signal,
      ).then((payload) => parseSolrFacetList(payload, `cgmlst_${level}`)),
    ),
  );

  return Object.fromEntries(
    hcLevels.map((level, i) => {
      const result = results[i];
      if (result.status === "rejected") {
        console.warn(
          `[cgmlst-distribution] ${level} fetch failed for taxonId=${taxonId}:`,
          result.reason,
        );
        return [level, []];
      }
      return [level, result.value];
    }),
  ) as CgmlstHcDistribution;
}
