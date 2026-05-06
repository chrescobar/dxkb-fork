import type { ComponentType, ReactNode } from "react";

export type OrganismViewKey = "overview" | "phylogeny" | "taxonomy" | "genomes";

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

export interface ExternalToolResource {
  label: string;
  href: string;
  description?: string;
}

export interface OrganismLandingConfig {
  displayName: string;
  taxonId: number;
  pubmedTerm: string;
  accent: "bacteria" | "viruses" | "fungi";
  externalTools: ExternalToolResource[];
  metadataFields: string[];
  defaultView?: OrganismViewKey;
}
