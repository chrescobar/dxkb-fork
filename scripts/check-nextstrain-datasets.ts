import { resolve } from "node:path";

import { localDatasetIds } from "../src/lib/phylogeny/dataset-inventory";
import { canonicalDatasetId } from "../src/lib/phylogeny/nextstrain-dataset";

const defaultManifestUrl =
  "https://www.bv-brc.org/api/content/phyloxml_trees/manifest.json";
const defaultFamilyBaseUrl =
  "https://www.bv-brc.org/api/content/phyloxml_trees/families/";

export interface Reference {
  taxonId: string;
  group: string;
}

export interface ReconciliationResult {
  advertised: number;
  available: number;
  missing: string[];
  unadvertised: string[];
}

export function familyDatasetUrl(baseUrl: string, taxonId: string): string {
  return `${baseUrl.replace(/\/?$/, "/")}${taxonId}/${taxonId}.json`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${url}: ${String(response.status)}`);
  return response.json() as Promise<unknown>;
}

export function manifestTaxonIds(value: unknown): string[] {
  if (!isRecord(value)) throw new Error("manifest has an invalid shape");
  const trees = isRecord(value.trees) ? value.trees : value;
  const ids = Object.keys(trees);
  if (!ids.every((id) => /^\d+$/.test(id))) {
    throw new Error("manifest contains an invalid taxon identifier");
  }
  return ids;
}

export function familyReferences(
  value: unknown,
  taxonId: string,
): Map<string, Reference[]> {
  if (!isRecord(value) || !Array.isArray(value.groups)) {
    throw new Error(`family ${taxonId} has an invalid shape`);
  }

  const references = new Map<string, Reference[]>();
  for (const group of value.groups) {
    if (!isRecord(group)) continue;
    if (typeof group.title !== "string") {
      throw new Error(`family ${taxonId}/unknown group has an invalid title`);
    }
    if (group.nextstrain === undefined) continue;
    if (!Array.isArray(group.nextstrain)) {
      throw new Error(
        `family ${taxonId}/${group.title} has invalid nextstrain records`,
      );
    }

    for (const tree of group.nextstrain) {
      if (!isRecord(tree) || typeof tree.path !== "string") {
        throw new Error(
          `family ${taxonId}/${group.title} has an invalid nextstrain record`,
        );
      }
      const datasetId = canonicalDatasetId(tree.path);
      if (!datasetId) {
        throw new Error(`invalid advertised dataset '${tree.path}'`);
      }
      const current = references.get(datasetId) ?? [];
      current.push({ taxonId, group: group.title });
      references.set(datasetId, current);
    }
  }
  return references;
}

function datasetDirectory(): string {
  const directory = process.env.NEXTSTRAIN_DATASET_DIR;
  if (!directory) throw new Error("NEXTSTRAIN_DATASET_DIR is not set");
  return resolve(directory);
}

export async function reconcileDatasets({
  directory,
  manifest,
  fetchFamily,
}: {
  directory: string;
  manifest: unknown;
  fetchFamily: (taxonId: string) => Promise<unknown>;
}): Promise<ReconciliationResult> {
  const taxonIds = manifestTaxonIds(manifest);
  const advertised = new Map<string, Reference[]>();

  for (const taxonId of taxonIds) {
    const family = await fetchFamily(taxonId);
    for (const [datasetId, references] of familyReferences(family, taxonId)) {
      advertised.set(datasetId, [
        ...(advertised.get(datasetId) ?? []),
        ...references,
      ]);
    }
  }

  const available = await localDatasetIds(directory);
  const missing = [...advertised.keys()]
    .filter((id) => !available.has(id))
    .sort();
  const unadvertised = [...available]
    .filter((id) => !advertised.has(id))
    .sort();

  for (const datasetId of missing) {
    const references = advertised
      .get(datasetId)
      ?.map((reference) => `${reference.taxonId}/${reference.group}`)
      .join(", ");
    console.warn(
      `missing: ${datasetId} (${references ?? "unknown reference"})`,
    );
  }
  for (const datasetId of unadvertised) {
    console.warn(`unadvertised: ${datasetId}`);
  }

  return {
    advertised: advertised.size,
    available: available.size,
    missing,
    unadvertised,
  };
}

async function main(): Promise<void> {
  const policy = process.argv.includes("--strict") ? "strict" : "gated";
  const manifestUrl = process.env.PHYLO_MANIFEST_URL ?? defaultManifestUrl;
  const familyBaseUrl =
    process.env.PHYLO_FAMILY_BASE_URL ?? defaultFamilyBaseUrl;
  const result = await reconcileDatasets({
    directory: datasetDirectory(),
    manifest: await fetchJson(manifestUrl),
    fetchFamily: (taxonId) => fetchJson(familyDatasetUrl(familyBaseUrl, taxonId)),
  });

  console.log(
    `nextstrain datasets: ${String(result.advertised)} advertised, ${String(result.available)} local, ${String(result.missing.length)} missing`,
  );
  if (policy === "strict" && result.missing.length > 0) process.exitCode = 1;
}

if (process.env.VITEST !== "true") {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
