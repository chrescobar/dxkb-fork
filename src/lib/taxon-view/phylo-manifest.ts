// src/lib/taxon-view/phylo-manifest.ts
import {
  organismBvBrcRevalidateSeconds,
  organismFetchCacheInit,
  responseErrorMessage,
} from "@/lib/services/organisms/utils";

import type { PhyloManifest } from "./tab-context";

const emptyManifest: PhyloManifest = { trees: {} };

function parseManifest(payload: unknown): PhyloManifest | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const trees = (payload as Record<string, unknown>).trees;
  if (!trees || typeof trees !== "object" || Array.isArray(trees)) return null;
  return { trees: trees as Record<string, unknown> };
}

/**
 * Fetch the published-viral-tree manifest (doc §4.5/§7.2). Fail-open by design:
 * a missing/broken manifest must NEVER block the taxon page — it only means the
 * viral Phylogeny tab is treated as "no tree" (disabled). When PHYLO_MANIFEST_URL
 * is unset we return an empty manifest (placeholder mode) so nothing is fetched.
 */
export async function fetchPhyloManifest(): Promise<PhyloManifest | null> {
  const url = process.env.PHYLO_MANIFEST_URL;
  if (!url) return emptyManifest;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
      ...organismFetchCacheInit(organismBvBrcRevalidateSeconds),
    });
    if (!response.ok) {
      console.error(`phylo-manifest: ${await responseErrorMessage(response)}`);
      return null;
    }
    return parseManifest(await response.json());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`phylo-manifest: ${message}`);
    return null;
  }
}
