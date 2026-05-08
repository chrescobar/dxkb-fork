import type { OrganismFetchOptions, OrganismSummary } from "./types";
import {
  getBvBrcWebsiteApiBaseUrl,
  numberOrNull,
  organismFetchCacheInit,
  organismBvBrcRevalidateSeconds,
  readJsonObject,
  responseErrorMessage,
} from "./utils";

export async function fetchOrganismSummary(
  taxonId: number,
  options: OrganismFetchOptions = {},
): Promise<OrganismSummary> {
  const baseUrl = getBvBrcWebsiteApiBaseUrl();
  const response = await fetch(`${baseUrl}/data/summary_by_taxon/${taxonId}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: options.signal,
    ...organismFetchCacheInit(organismBvBrcRevalidateSeconds),
  });

  if (!response.ok) {
    throw new Error(await responseErrorMessage(response));
  }

  const payload = await readJsonObject(response, "summary_by_taxon");

  return {
    count: numberOrNull(payload.count, "count"),
    uniqueFamily: numberOrNull(payload.unique_family, "unique_family"),
    uniqueGenus: numberOrNull(payload.unique_genus, "unique_genus"),
    uniqueSpecies: numberOrNull(payload.unique_species, "unique_species"),
    cds: numberOrNull(payload.CDS, "CDS"),
    matPeptide: numberOrNull(payload.mat_peptide, "mat_peptide"),
    pdb: numberOrNull(payload.PDB, "PDB"),
  };
}
