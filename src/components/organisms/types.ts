import type { ComponentType, ReactNode } from "react";

export type OrganismViewKey =
  | "overview"
  | "phylogeny"
  | "taxonomy"
  | "genomes"
  | "amr-phenotypes"
  | "sequences"
  | "features"
  | "proteins"
  | "protein-structures"
  | "specialty-genes"
  | "domains-and-motifs"
  | "epitopes"
  | "pathways"
  | "subsystems"
  | "experiments"
  | "interactions";

export interface OrganismLandingView {
  key: OrganismViewKey;
  label: string;
  icon: ReactNode;
  Component: ComponentType;
}

export interface OrganismLandingNavItem {
  key: OrganismViewKey;
  label: string;
  icon: ReactNode;
}

export interface OrganismLandingConfig {
  displayName: string;
  taxonId: number;
  accent: "bacteria" | "viruses" | "fungi" | "all";
  metadataFields: string[];
  defaultView?: OrganismViewKey;
}
