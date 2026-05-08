import type { OrganismFetchOptions, OrganismTaxonomy } from "./types";
import {
  getBvBrcWebsiteApiBaseUrl,
  numberOrNull,
  organismFetchCacheInit,
  organismBvBrcRevalidateSeconds,
  readJsonObject,
  requiredNumber,
  requiredString,
  responseErrorMessage,
} from "./utils";

function parseLineageNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
}

export async function fetchOrganismTaxonomy(
  taxonId: number,
  options: OrganismFetchOptions = {},
): Promise<OrganismTaxonomy> {
  const baseUrl = getBvBrcWebsiteApiBaseUrl();
  const response = await fetch(`${baseUrl}/taxonomy/${taxonId}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: options.signal,
    ...organismFetchCacheInit(organismBvBrcRevalidateSeconds),
  });

  if (!response.ok) {
    throw new Error(await responseErrorMessage(response));
  }

  const payload = await readJsonObject(response, `taxonomy/${taxonId}`);

  return {
    taxonId: requiredNumber(payload.taxon_id ?? payload.taxonId ?? taxonId, "taxon_id"),
    taxonName: requiredString(payload.taxon_name ?? payload.taxonName, "taxon_name"),
    lineageNames: parseLineageNames(payload.lineage_names ?? payload.lineageNames),
    taxonRank: requiredString(payload.taxon_rank ?? payload.taxonRank, "taxon_rank"),
    genomes: numberOrNull(payload.genomes, "genomes"),
  };
}
