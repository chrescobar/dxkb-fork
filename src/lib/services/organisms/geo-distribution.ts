import type {
  OrganismFetchOptions,
  OrganismGeoDistribution,
  OrganismGeoLocationMeta,
} from "./types";
import {
  buildGenomeGeoFacetUrl,
  buildGenomeGeoPivotUrl,
  getBvBrcWebsiteApiBaseUrl,
  organismBvBrcRevalidateSeconds,
  organismFetchCacheInit,
  parseSolrFacetList,
  parseSolrFacetPivot,
  readJsonObject,
  responseErrorMessage,
} from "./utils";

const countryLimit = 300;
const stateLimit = 100;
const countyLimit = 1000;

async function fetchSolr(url: string, signal: AbortSignal | undefined, source: string): Promise<Record<string, unknown>> {
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

async function fetchField(baseUrl: string, taxonId: number, field: string, limit: number | undefined, signal: AbortSignal | undefined): Promise<Record<string, number>> {
  const url = buildGenomeGeoFacetUrl(baseUrl, taxonId, field, limit);
  const payload = await fetchSolr(url, signal, `genome ${field} facet`);
  const list = parseSolrFacetList(payload, field);
  const map: Record<string, number> = {};
  for (const item of list) {
    if (item.name && item.count > 0) map[item.name] = item.count;
  }
  return map;
}

async function fetchPivot(baseUrl: string, taxonId: number, primary: string, secondary: string, limit: number | undefined, signal: AbortSignal | undefined): Promise<Record<string, Record<string, number>>> {
  const url = buildGenomeGeoPivotUrl(baseUrl, taxonId, primary, secondary, limit);
  const payload = await fetchSolr(url, signal, `genome ${primary},${secondary} pivot`);
  return parseSolrFacetPivot(payload, `${primary},${secondary}`);
}

async function fetchPivotOrEmpty(baseUrl: string, taxonId: number, primary: string, secondary: string, limit: number | undefined, signal: AbortSignal | undefined): Promise<Record<string, Record<string, number>>> {
  try {
    return await fetchPivot(baseUrl, taxonId, primary, secondary, limit, signal);
  } catch {
    return {};
  }
}

function buildMeta(
  counts: Record<string, number>,
  genera: Record<string, Record<string, number>>,
  hosts: Record<string, Record<string, number>>,
): Record<string, OrganismGeoLocationMeta> {
  const meta: Record<string, OrganismGeoLocationMeta> = {};
  for (const [name, count] of Object.entries(counts)) {
    meta[name] = {
      count,
      genera: genera[name] ?? {},
      hosts: hosts[name] ?? {},
    };
  }
  return meta;
}

function deriveMaxCount(...maps: Record<string, number>[]): number {
  let max = 0;
  for (const map of maps) {
    for (const value of Object.values(map)) {
      if (value > max) max = value;
    }
  }
  return max;
}

export async function fetchOrganismGeoDistribution(
  taxonId: number,
  options: OrganismFetchOptions = {},
): Promise<OrganismGeoDistribution> {
  const baseUrl = getBvBrcWebsiteApiBaseUrl();
  const { signal } = options;

  const [countryData, stateData, countyData] = await Promise.all([
    fetchField(baseUrl, taxonId, "isolation_country", countryLimit, signal),
    fetchField(baseUrl, taxonId, "state_province", stateLimit, signal),
    fetchField(baseUrl, taxonId, "county", countyLimit, signal),
  ]);

  const [
    countryGenera,
    countryHosts,
    stateGenera,
    stateHosts,
    countyGenera,
  ] = await Promise.all([
    fetchPivotOrEmpty(baseUrl, taxonId, "isolation_country", "genus", undefined, signal),
    fetchPivotOrEmpty(baseUrl, taxonId, "isolation_country", "host_common_name", undefined, signal),
    fetchPivotOrEmpty(baseUrl, taxonId, "state_province", "genus", undefined, signal),
    fetchPivotOrEmpty(baseUrl, taxonId, "state_province", "host_common_name", undefined, signal),
    fetchPivotOrEmpty(baseUrl, taxonId, "county", "genus", countyLimit, signal),
  ]);

  return {
    countryData,
    countryMeta: buildMeta(countryData, countryGenera, countryHosts),
    stateData,
    stateMeta: buildMeta(stateData, stateGenera, stateHosts),
    countyData,
    countyMeta: buildMeta(countyData, countyGenera, {}),
    maxCount: deriveMaxCount(countryData, stateData, countyData),
  };
}
