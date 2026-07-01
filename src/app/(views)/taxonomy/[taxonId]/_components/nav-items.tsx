// src/app/(views)/taxonomy/[taxonId]/_components/nav-items.tsx
import type {
  OrganismLandingConfig,
  OrganismLandingView,
} from "@/components/organisms/types";
import { getCuratedLists } from "@/lib/taxon-view/curated-lists";
import { buildTabContext } from "@/lib/taxon-view/tab-context";
import type { PhyloManifest } from "@/lib/taxon-view/tab-context";
import { resolveTabs } from "@/lib/taxon-view/tab-policy";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

import { makeOverviewView } from "../views/overview";
import { makeTaxonomyTreeView } from "../views/taxonomy-tree-view";
import { makeStrainsView } from "../views/strains";
import { makeSurveillanceView } from "../views/surveillance";
import { makeSerologyView } from "../views/serology";
import { makeSfvtView } from "../views/sfvt";

/**
 * Build the taxon-view tab strip by evaluating the declarative tab policy
 * against the taxon's lineage, the phylo manifest, and the curated cohort
 * lists. Conditional tabs that don't apply are returned disabled (shown but
 * greyed) rather than removed.
 */
export function buildTaxonomyNavItems(
  config: OrganismLandingConfig,
  taxon: OrganismTaxonomy | null,
  manifest: PhyloManifest | null,
): OrganismLandingView[] {
  const ctx = buildTabContext(taxon, manifest, getCuratedLists());
  return resolveTabs(ctx, {
    overview: {
      Component: makeOverviewView({
        config,
        taxon,
        showAmr: config.showAmr ?? false,
      }),
    },
    taxonomy: { Component: makeTaxonomyTreeView({ taxon }) },
    strains: { Component: makeStrainsView({ taxon }) },
    surveillance: { Component: makeSurveillanceView({ taxon }) },
    serology: { Component: makeSerologyView({ taxon }) },
    sfvt: { Component: makeSfvtView({ taxon }) },
  });
}
