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
  | "interactions"
  | "strains"
  | "surveillance"
  | "serology"
  | "sfvt";

export interface OrganismLandingView {
  key: OrganismViewKey;
  label: string;
  icon: ReactNode;
  Component: ComponentType;
  /** When false, the tab renders disabled (greyed, non-clickable). Defaults to enabled. */
  enabled?: boolean;
  /** Tooltip/title shown when the tab is disabled. */
  disabledReason?: string;
}

export interface OrganismLandingNavItem {
  key: OrganismViewKey;
  label: string;
  icon: ReactNode;
  enabled?: boolean;
  disabledReason?: string;
}

export interface OrganismLandingConfig {
  displayName: string;
  taxonId: number;
  accent: "bacteria" | "viruses" | "fungi" | "all";
  metadataFields: string[];
  showAmr?: boolean;
  defaultView?: OrganismViewKey;
  /** When true, tabs with enabled=false are removed from the strip. Default: false (shown greyed). */
  hideDisabledTabs?: boolean;
}

// Sentinel that can be placed in metadataFields to position the Taxonomic
// Distribution chart within the grid. Without it the chart renders last.
export const taxonomicDistributionSentinel = "_taxonomic_distribution";
