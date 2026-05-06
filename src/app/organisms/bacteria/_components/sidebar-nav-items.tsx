import { Binary, Blocks, Dna, Network } from "lucide-react";

import type { OrganismLandingView } from "@/components/organisms/types";

import { GenomesView, OverviewView, PhylogenyView, TaxonomyView } from "../views";

export function getBacteriaSidebarNavItems(): OrganismLandingView[] {
  return [
    {
      key: "overview",
      label: "Overview",
      icon: <Blocks />,
      Component: OverviewView,
    },
    {
      key: "phylogeny",
      label: "Phylogeny",
      icon: <Network />,
      Component: PhylogenyView,
    },
    {
      key: "taxonomy",
      label: "Taxonomy",
      icon: <Binary />,
      Component: TaxonomyView,
    },
    {
      key: "genomes",
      label: "Genomes",
      icon: <Dna />,
      Component: GenomesView,
    },
  ];
}
