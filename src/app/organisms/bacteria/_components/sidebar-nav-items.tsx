import {
  Activity,
  Atom,
  Binary,
  Blocks,
  Database,
  Dna,
  FlaskConical,
  Handshake,
  Layers,
  ListTree,
  Microscope,
  Network,
  Puzzle,
  Route,
  ShieldCheck,
  Waypoints,
} from "lucide-react";

import type { OrganismLandingView } from "@/components/organisms/types";

import {
  GenomesView,
  OverviewView,
  PhylogenyView,
  PlaceholderView,
  TaxonomyView,
} from "../views";

function placeholderView(title: string) {
  function BacteriaPlaceholderView() {
    return <PlaceholderView title={title} />;
  }

  BacteriaPlaceholderView.displayName = `${title.replaceAll(" ", "")}View`;
  return BacteriaPlaceholderView;
}

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
    {
      key: "amr-phenotypes",
      label: "AMR Phenotypes",
      icon: <ShieldCheck />,
      Component: placeholderView("AMR Phenotypes"),
    },
    {
      key: "sequences",
      label: "Sequences",
      icon: <Database />,
      Component: placeholderView("Sequences"),
    },
    {
      key: "features",
      label: "Features",
      icon: <ListTree />,
      Component: placeholderView("Features"),
    },
    {
      key: "proteins",
      label: "Proteins",
      icon: <Atom />,
      Component: placeholderView("Proteins"),
    },
    {
      key: "protein-structures",
      label: "Protein Structures",
      icon: <Blocks />,
      Component: placeholderView("Protein Structures"),
    },
    {
      key: "specialty-genes",
      label: "Specialty Genes",
      icon: <Microscope />,
      Component: placeholderView("Specialty Genes"),
    },
    {
      key: "domains-and-motifs",
      label: "Domains and Motifs",
      icon: <Puzzle />,
      Component: placeholderView("Domains and Motifs"),
    },
    {
      key: "epitopes",
      label: "Epitopes",
      icon: <Activity />,
      Component: placeholderView("Epitopes"),
    },
    {
      key: "pathways",
      label: "Pathways",
      icon: <Route />,
      Component: placeholderView("Pathways"),
    },
    {
      key: "subsystems",
      label: "Subsystems",
      icon: <Layers />,
      Component: placeholderView("Subsystems"),
    },
    {
      key: "experiments",
      label: "Experiments",
      icon: <FlaskConical />,
      Component: placeholderView("Experiments"),
    },
    {
      key: "interactions",
      label: "Interactions",
      icon: <Handshake />,
      Component: placeholderView("Interactions"),
    },
  ];
}
