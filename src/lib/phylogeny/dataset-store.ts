import "server-only";

import { readdir, readFile, realpath, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";

import {
  canonicalDatasetId,
  datasetFilename,
  parseDatasetId,
} from "./nextstrain-dataset";

export const SIDECARS = [
  "tip-frequencies",
  "root-sequence",
  "measurements",
] as const;
export type Sidecar = (typeof SIDECARS)[number];

let inventoryPromise: Promise<Set<string>> | null = null;

function datasetDirectory(): string {
  const directory = process.env.NEXTSTRAIN_DATASET_DIR;
  if (!directory) throw new Error("NEXTSTRAIN_DATASET_DIR is not set");
  return resolve(directory);
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

function isAuspiceV2Dataset(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "version" in value &&
    (value.version === "v2" || value.version === "2.0") &&
    "meta" in value &&
    typeof value.meta === "object" &&
    value.meta !== null &&
    !Array.isArray(value.meta) &&
    "tree" in value &&
    typeof value.tree === "object" &&
    value.tree !== null &&
    !Array.isArray(value.tree)
  );
}

async function renderableDatasetId(
  directoryRealPath: string,
  filename: string,
): Promise<string | null> {
  if (
    !filename.endsWith(".json") ||
    SIDECARS.some(sidecar => filename.endsWith(`_${sidecar}.json`))
  ) {
    return null;
  }

  const datasetId = canonicalDatasetId(
    filename.slice(0, -".json".length).split("_").join("/"),
  );
  if (!datasetId) return null;

  let targetRealPath: string;
  try {
    targetRealPath = await realpath(resolve(directoryRealPath, filename));
  } catch (error) {
    if (isMissingFile(error)) return null;
    throw error;
  }
  if (!targetRealPath.startsWith(`${directoryRealPath}${sep}`)) return null;
  if (!(await stat(targetRealPath)).isFile()) return null;

  try {
    const value: unknown = JSON.parse(await readFile(targetRealPath, "utf8"));
    return isAuspiceV2Dataset(value) ? datasetId : null;
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
}

export function availableDatasetIds(): Promise<Set<string>> {
  if (!inventoryPromise) {
    const directory = datasetDirectory();
    inventoryPromise = Promise.all([realpath(directory), readdir(directory)])
      .then(async ([directoryRealPath, files]) => {
        const ids = await Promise.all(
          files.map(filename => renderableDatasetId(directoryRealPath, filename)),
        );
        return new Set(ids.filter((id): id is string => id !== null));
      })
      .catch((error: unknown) => {
        inventoryPromise = null;
        throw error;
      });
  }

  return inventoryPromise;
}

export function resetDatasetInventoryForTests(): void {
  inventoryPromise = null;
}

export async function readDataset(
  datasetId: string,
  sidecar?: Sidecar,
): Promise<string | null> {
  const parts = parseDatasetId(datasetId);
  if (!parts) return null;

  const directory = datasetDirectory();
  const target = resolve(directory, datasetFilename(parts, sidecar));
  if (!target.startsWith(`${directory}${sep}`)) return null;

  const directoryRealPath = await realpath(directory);

  let targetRealPath: string;
  try {
    targetRealPath = await realpath(target);
  } catch (error) {
    if (isMissingFile(error)) return null;
    throw error;
  }

  if (!targetRealPath.startsWith(`${directoryRealPath}${sep}`)) return null;

  try {
    return await readFile(targetRealPath, "utf8");
  } catch (error) {
    if (isMissingFile(error)) return null;
    throw error;
  }
}
