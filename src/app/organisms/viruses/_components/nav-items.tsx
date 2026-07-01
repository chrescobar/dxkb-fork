import {
  Activity,
  Binary,
  Blocks,
  Boxes,
  Dna,
  FlaskConical,
  ListTree,
  Puzzle,
} from "lucide-react";

import type { OrganismLandingView } from "@/components/organisms/types";

import { OverviewView } from "../views/overview";
import {
  DomainsAndMotifsView,
  EpitopesView,
  ExperimentsView,
  FeaturesView,
  GenomesView,
  ProteinStructuresView,
  TaxonomyView,
} from "../views/placeholder";

export const virusNavItems: OrganismLandingView[] = [
  {
    key: "overview",
    label: "Overview",
    icon: <Blocks />,
    Component: OverviewView,
  },
  {
    key: "taxa-tree",
    label: "Taxa Tree",
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
