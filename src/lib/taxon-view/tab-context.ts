// src/lib/taxon-view/tab-context.ts
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

import type { CuratedLists } from "./curated-lists";

/** Remote manifest of published viral phylogenetic trees, keyed by taxon_id (string). */
export interface PhyloManifest {
  trees: Record<string, unknown>;
}

/** The three (and only three) data sources every tab predicate may consult (doc §7.1). */
export interface TabContext {
  taxonomy: {
    taxonId: number;
    lineageNames: readonly string[];
    lineageIds: readonly number[];
  };
  phyloManifest: PhyloManifest | null; // null ⇒ fetch failed → fail-open
  curatedLists: CuratedLists;
}

export function buildTabContext(
  taxon: OrganismTaxonomy | null,
  manifest: PhyloManifest | null,
  lists: CuratedLists,
): TabContext {
  return {
    taxonomy: {
      taxonId: taxon?.taxonId ?? 0,
      lineageNames: taxon?.lineageNames ?? [],
      lineageIds: taxon?.lineageIds ?? [],
    },
    phyloManifest: manifest,
    curatedLists: lists,
  };
}
