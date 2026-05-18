import { getRequiredEnv } from "@/lib/env";

const oneDaySeconds = 86400;
const bacteriaTaxonId = "2";

export type KpiKey = "families" | "genera" | "species" | "genomes" | "cds" | "matPeptides" | "pdbStructures";

export interface KpiValue {
  key: KpiKey;
  label: string;
  count: number | null;
  isMock: boolean;
}

export type FacetEntry = readonly [label: string, count: number];

export interface FeaturedGenusData {
  rank: number;
  name: string;
  genomeCount: number;
  phylum: string | null;
  cellShape: string | null;
}

export interface GeneraTableRowData {
  id: string;
  name: string;
  phylum: string | null;
  genomeCount: number;
  distributionPct: number;
}

export interface FacetDistribution {
  total: number;
  topSlices: FacetEntry[];
  othersCount: number;
}

interface SolrCountResponse {
  response?: { numFound?: unknown };
}

interface SolrFacetResponse {
  response?: { numFound?: unknown };
  facet_counts?: {
    facet_fields?: Record<string, Record<string, unknown> | unknown[]>;
  };
}

function buildUrl(path: string): string {
  const baseUrl = getRequiredEnv("NEXT_PUBLIC_DATA_API").replace(/\/+$/, "");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function bvbrcFetch<T>(path: string, signal?: AbortSignal): Promise<T> {
  const url = buildUrl(path);
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/solr+json" },
    signal,
    next: { revalidate: oneDaySeconds },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const detail = body.trim() || `${response.status} ${response.statusText}`;
    throw new Error(detail);
  }
  return (await response.json()) as T;
}

function readNumFound(payload: SolrCountResponse | SolrFacetResponse): number {
  const numFound = payload.response?.numFound;
  if (typeof numFound !== "number" || !Number.isFinite(numFound)) {
    throw new Error("Unexpected SOLR response shape — missing response.numFound");
  }
  return numFound;
}

function readFacet(payload: SolrFacetResponse, field: string): FacetEntry[] {
  const fields = payload.facet_counts?.facet_fields;
  if (!fields) {
    throw new Error(`Unexpected SOLR response shape — missing facet_counts.facet_fields`);
  }
  const bucket = fields[field];
  if (!bucket) {
    throw new Error(`Facet field "${field}" not present in response`);
  }
  if (Array.isArray(bucket)) {
    const pairs: FacetEntry[] = [];
    for (let i = 0; i < bucket.length; i += 2) {
      const label = bucket[i];
      const count = bucket[i + 1];
      if (typeof label === "string" && typeof count === "number") {
        pairs.push([label, count]);
      }
    }
    return pairs;
  }
  return Object.entries(bucket)
    .filter((entry): entry is [string, number] => typeof entry[1] === "number")
    .map(([label, count]) => [label, count] as FacetEntry);
}

interface KpiDefinition {
  key: KpiKey;
  label: string;
  path: string | null;
}

const kpiDefinitions: readonly KpiDefinition[] = Object.freeze([
  { key: "families", label: "Families", path: `/taxonomy/?eq(taxon_rank,family)&eq(division,Bacteria)&limit(1)` },
  { key: "genera", label: "Genera", path: `/taxonomy/?eq(taxon_rank,genus)&eq(division,Bacteria)&limit(1)` },
  { key: "species", label: "Species", path: `/taxonomy/?eq(taxon_rank,species)&eq(division,Bacteria)&limit(1)` },
  { key: "genomes", label: "Genomes", path: `/genome/?eq(taxon_lineage_ids,${bacteriaTaxonId})&limit(1)` },
  { key: "cds", label: "CDS", path: null },
  { key: "matPeptides", label: "Peptides", path: null },
  { key: "pdbStructures", label: "PDB Structures", path: `/protein_structure/?eq(taxon_lineage_ids,${bacteriaTaxonId})&limit(1)` },
] as const);

export async function fetchKpis(signal?: AbortSignal): Promise<KpiValue[]> {
  const settled = await Promise.allSettled(
    kpiDefinitions.map(async (definition) => {
      if (!definition.path) {
        return null;
      }
      const payload = await bvbrcFetch<SolrCountResponse>(definition.path, signal);
      return readNumFound(payload);
    }),
  );

  return kpiDefinitions.map((definition, index) => {
    const result = settled[index];
    if (result.status === "fulfilled") {
      return {
        key: definition.key,
        label: definition.label,
        count: result.value,
        isMock: result.value === null,
      };
    }
    const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
    console.error(`BV-BRC KPI failed for ${definition.key}: ${reason}`);
    return { key: definition.key, label: definition.label, count: null, isMock: true };
  });
}

function extractPhylumFromLineage(lineage: string | undefined | null): string | null {
  if (!lineage || typeof lineage !== "string") return null;
  const parts = lineage.split(",").map((s) => s.trim());
  return parts[3] ?? null;
}

interface TaxonomyDoc {
  taxon_name?: string;
  lineage?: string;
}

async function fetchPhylumLookup(genusNames: string[], signal?: AbortSignal): Promise<Map<string, string | null>> {
  if (genusNames.length === 0) return new Map();
  const inList = genusNames.map((n) => n.replace(/[(),]/g, "")).join(",");
  const path = `/taxonomy/?eq(taxon_rank,genus)&in(taxon_name,(${inList}))&select(taxon_name,lineage)&limit(${Math.max(genusNames.length, 30)})`;
  const payload = await bvbrcFetch<{ response?: { docs?: TaxonomyDoc[] } }>(path, signal);
  const docs = payload.response?.docs ?? [];
  const map = new Map<string, string | null>();
  for (const doc of docs) {
    if (typeof doc.taxon_name === "string") {
      map.set(doc.taxon_name, extractPhylumFromLineage(doc.lineage));
    }
  }
  return map;
}

interface GenusFacetPayload extends SolrFacetResponse {
  response?: { numFound?: number };
}

const featuredGenusCount = 6;

export async function fetchFeaturedGenera(signal?: AbortSignal): Promise<FeaturedGenusData[]> {
  const path = `/genome/?eq(taxon_lineage_ids,${bacteriaTaxonId})&limit(1,0)&facet((field,genus),(limit,${featuredGenusCount + 4}),(mincount,1))&json(nl,map)`;
  const payload = await bvbrcFetch<GenusFacetPayload>(path, signal);
  const facet = readFacet(payload, "genus")
    .filter(([label]) => label.length > 0)
    .slice(0, featuredGenusCount);

  const genusNames = facet.map(([name]) => name);
  const [phylumMap, cellShapeMap] = await Promise.all([
    fetchPhylumLookup(genusNames, signal).catch(() => new Map<string, string | null>()),
    fetchCellShapeMap(genusNames, signal).catch(() => new Map<string, string | null>()),
  ]);

  return facet.map(([name, count], index) => ({
    rank: index + 1,
    name,
    genomeCount: count,
    phylum: phylumMap.get(name) ?? null,
    cellShape: cellShapeMap.get(name) ?? null,
  }));
}

async function fetchCellShapeMap(genusNames: string[], signal?: AbortSignal): Promise<Map<string, string | null>> {
  const entries = await Promise.allSettled(
    genusNames.map(async (name) => {
      const path = `/genome/?eq(genus,${encodeURIComponent(name)})&limit(1,0)&facet((field,cell_shape),(limit,3),(mincount,1))&json(nl,map)`;
      const payload = await bvbrcFetch<SolrFacetResponse>(path, signal);
      const facet = readFacet(payload, "cell_shape").filter(([label]) => label.length > 0);
      const top = facet[0];
      return [name, top ? top[0] : null] as const;
    }),
  );
  const map = new Map<string, string | null>();
  for (const entry of entries) {
    if (entry.status === "fulfilled") {
      map.set(entry.value[0], entry.value[1]);
    }
  }
  return map;
}

const generaTablePoolSize = 24;

export async function fetchGeneraTable(excludeNames: string[], signal?: AbortSignal): Promise<GeneraTableRowData[]> {
  const path = `/genome/?eq(taxon_lineage_ids,${bacteriaTaxonId})&limit(1,0)&facet((field,genus),(limit,${generaTablePoolSize + excludeNames.length + 5}),(mincount,1))&json(nl,map)`;
  const payload = await bvbrcFetch<SolrFacetResponse>(path, signal);
  const facet = readFacet(payload, "genus")
    .filter(([label]) => label.length > 0 && !excludeNames.includes(label))
    .slice(0, generaTablePoolSize - excludeNames.length);

  const max = facet.reduce((acc, [, count]) => Math.max(acc, count), 1);

  const sorted = [...facet].sort((a, b) => a[0].localeCompare(b[0]));
  const phylumMap = await fetchPhylumLookup(
    sorted.map(([name]) => name),
    signal,
  ).catch(() => new Map<string, string | null>());

  return sorted.map(([name, count], index) => ({
    id: String(index + 7).padStart(2, "0"),
    name,
    phylum: phylumMap.get(name) ?? null,
    genomeCount: count,
    distributionPct: Math.round((count / max) * 100),
  }));
}

async function fetchSimpleFacet(field: string, sliceLimit: number, signal?: AbortSignal): Promise<FacetDistribution> {
  const path = `/genome/?eq(taxon_lineage_ids,${bacteriaTaxonId})&limit(1,0)&facet((field,${field}),(limit,${sliceLimit}),(mincount,1))&json(nl,map)`;
  const payload = await bvbrcFetch<GenusFacetPayload>(path, signal);
  const total = readNumFound(payload);
  const slices = readFacet(payload, field);
  const summed = slices.reduce((acc, [, count]) => acc + count, 0);
  return {
    total,
    topSlices: slices,
    othersCount: Math.max(total - summed, 0),
  };
}

export function fetchGenusFacet(signal?: AbortSignal): Promise<FacetDistribution> {
  return fetchSimpleFacet("genus", 5, signal);
}

export function fetchHostFacet(signal?: AbortSignal): Promise<FacetDistribution> {
  return fetchSimpleFacet("host_name", 5, signal);
}

export function fetchCountryFacet(signal?: AbortSignal): Promise<FacetDistribution> {
  return fetchSimpleFacet("isolation_country", 5, signal);
}
