import "server-only";

import { readFile, realpath, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  isWithinDirectory,
  localDatasetIds,
  sidecars,
  type Sidecar,
} from "./dataset-inventory";
import { datasetFilename, parseDatasetId } from "./nextstrain-dataset";

export { sidecars, type Sidecar };

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

export function availableDatasetIds(): Promise<Set<string>> {
  if (!inventoryPromise) {
    const directory = datasetDirectory();
    inventoryPromise = localDatasetIds(directory).catch((error: unknown) => {
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
  if (!isWithinDirectory(directory, target)) return null;

  const directoryRealPath = await realpath(directory);

  let targetRealPath: string;
  try {
    targetRealPath = await realpath(target);
  } catch (error) {
    if (isMissingFile(error)) return null;
    throw error;
  }

  if (!isWithinDirectory(directoryRealPath, targetRealPath)) return null;

  try {
    const stats = await stat(targetRealPath);
    if (!stats.isFile()) return null;
  } catch (error) {
    if (isMissingFile(error)) return null;
    throw error;
  }

  try {
    return await readFile(targetRealPath, "utf8");
  } catch (error) {
    if (isMissingFile(error)) return null;
    throw error;
  }
}
