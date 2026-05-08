import {
  Activity,
  Atom,
  Binary,
  Blocks,
  Boxes,
  Dna,
  FlaskConical,
  ListTree,
  Puzzle,
} from "lucide-react";

import type { OrganismLandingView } from "@/components/organisms/types";

import {
  DomainsAndMotifsView,
  EpitopesView,
  ExperimentsView,
  FeaturesView,
  GenomesView,
  OverviewView,
  ProteinsView,
  ProteinStructuresView,
  TaxonomyView,
} from "../views";

export function getVirusNavItems(): OrganismLandingView[] {
  return [
    {
      key: "overview",
      label: "Overview",
      icon: <Blocks />,
      Component: OverviewView,
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
    {
      key: "features",
      label: "Features",
      icon: <ListTree />,
      Component: FeaturesView,
    },
    {
      key: "proteins",
      label: "Proteins",
      icon: <Atom />,
      Component: ProteinsView,
    },
    {
      key: "protein-structures",
      label: "Protein Structures",
      icon: <Boxes />,
      Component: ProteinStructuresView,
    },
    {
      key: "domains-and-motifs",
      label: "Domains and Motifs",
      icon: <Puzzle />,
      Component: DomainsAndMotifsView,
    },
    {
      key: "epitopes",
      label: "Epitopes",
      icon: <Activity />,
      Component: EpitopesView,
    },
    {
      key: "experiments",
      label: "Experiments",
      icon: <FlaskConical />,
      Component: ExperimentsView,
    },
  ];
}
