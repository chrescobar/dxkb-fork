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
import { makePhylogenyView } from "../views/phylogeny";
import { makeTaxonomyTreeView } from "../views/taxonomy-tree-view";
import { makeGenomesView } from "../views/genomes";
import { makeSequencesView } from "../views/sequences";
import { makeProteinStructuresView } from "../views/protein-structures";
import { makeDomainsAndMotifsView } from "../views/domains-and-motifs";
import { makeFeaturesView } from "../views/features";
import { makeExperimentsView } from "../views/experiments";
import { makeStrainsView } from "../views/strains";
import { makeSurveillanceView } from "../views/surveillance";
import { makeSerologyView } from "../views/serology";
import { makeSfvtView } from "../views/sfvt";
import { makeEpitopesView } from "../views/epitopes";

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
  const lists = getCuratedLists();
  const ctx = buildTabContext(taxon, manifest, lists);
  return resolveTabs(ctx, {
    overview: {
      Component: makeOverviewView({
        config,
        taxon,
        showAmr: config.showAmr ?? false,
      }),
    },
    phylogeny: { Component: makePhylogenyView({ taxon }), layout: "fill" },
    "taxa-tree": { Component: makeTaxonomyTreeView({ taxon }), layout: "fill" },
    genomes: { Component: makeGenomesView({ taxon }), layout: "fill" },
    sequences: { Component: makeSequencesView({ taxon }), layout: "fill" },
    "protein-structures": { Component: makeProteinStructuresView({ taxon }), layout: "fill" },
    "domains-and-motifs": { Component: makeDomainsAndMotifsView({ taxon }), layout: "fill" },
    features: { Component: makeFeaturesView({ taxon }), layout: "fill" },
    experiments: { Component: makeExperimentsView({ taxon }), layout: "fill" },
    strains: { Component: makeStrainsView({ taxon }), layout: "fill" },
    surveillance: { Component: makeSurveillanceView({ taxon }), layout: "fill" },
    serology: { Component: makeSerologyView({ taxon }), layout: "fill" },
    sfvt: { Component: makeSfvtView({ taxon, sfvtTaxonIds: lists.sfvtTaxonIds }), layout: "fill" },
    epitopes: { Component: makeEpitopesView({ taxon }), layout: "fill" },
  });
}
