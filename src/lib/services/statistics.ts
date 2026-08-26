import { getRequiredEnv } from "@/lib/env";

export type StatisticKey =
  | "viralGenomes"
  | "proteinEntries"
  | "virusSpecies"
  | "epitopes"
  | "taxons"
  | "proteinStructures"
  | "proteinFeatures"
  | "genomes";

export interface StatisticDefinition {
  readonly key: StatisticKey;
  readonly label: string;
  readonly core: string;
  readonly filter: string;
}

export const dbStatisticsDefinitions: readonly StatisticDefinition[] = Object.freeze([
  { key: "viralGenomes", label: "Viral Genomes", core: "genome", filter: "eq(superkingdom,Viruses)" },
  { key: "proteinEntries", label: "Protein Entries", core: "genome_feature", filter: "eq(feature_type,CDS)" },
  { key: "virusSpecies", label: "Virus Species", core: "taxonomy", filter: "and(eq(taxon_rank,species),eq(lineage,*Viruses*))" },
  { key: "epitopes", label: "Epitopes", core: "epitope", filter: "" },
  { key: "taxons", label: "Taxons", core: "taxonomy", filter: "" },
  { key: "proteinStructures", label: "Protein Structures", core: "protein_structure", filter: "" },
  { key: "proteinFeatures", label: "Protein Features", core: "protein_feature", filter: "" },
  { key: "genomes", label: "Genomes", core: "genome", filter: "" },
] as const);

export type StatisticCounts = Record<StatisticKey, number | null>;

interface FetchOptions {
  signal?: AbortSignal;
}

interface SolrCountResponse {
  response?: { numFound?: unknown };
}

const oneHourSeconds = 3600;
const requestTimeoutMs = 10_000;

function buildCountUrl(baseUrl: string, definition: StatisticDefinition): string {
  const trimmedBase = baseUrl.replace(/\/+$/, "");
  const filter = definition.filter ? `${definition.filter}&` : "";
  return `${trimmedBase}/${definition.core}/?${filter}limit(1)`;
}

async function fetchCount(
  definition: StatisticDefinition,
  baseUrl: string,
  signal: AbortSignal | undefined,
): Promise<number> {
  const url = buildCountUrl(baseUrl, definition);
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/solr+json" },
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(requestTimeoutMs)])
      : AbortSignal.timeout(requestTimeoutMs),
    next: { revalidate: oneHourSeconds },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const detail = body.trim() || `${String(response.status)} ${response.statusText}`;
    throw new Error(detail);
  }

  const payload = (await response.json()) as SolrCountResponse;
  const numFound = payload.response?.numFound;
  if (typeof numFound !== "number" || !Number.isFinite(numFound)) {
    throw new Error(`Unexpected SOLR response shape — missing response.numFound`);
  }
  return numFound;
}

export async function fetchDbStatistics(
  options: FetchOptions = {},
): Promise<StatisticCounts> {
  const baseUrl = getRequiredEnv("NEXT_PUBLIC_DATA_API");
  const settled = await Promise.allSettled(
    dbStatisticsDefinitions.map((definition) =>
      fetchCount(definition, baseUrl, options.signal),
    ),
  );

  const counts = {} as StatisticCounts;
  settled.forEach((result, index) => {
    const definition = dbStatisticsDefinitions[index];
    if (result.status === "fulfilled") {
      counts[definition.key] = result.value;
      return;
    }
    const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
    console.error(`BV-BRC count failed for ${definition.core}: ${reason}`);
    counts[definition.key] = null;
  });

  return counts;
}
