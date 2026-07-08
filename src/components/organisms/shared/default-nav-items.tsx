import {
  Activity,
  Binary,
  Blocks,
  Database,
  Dna,
  FlaskConical,
  Handshake,
  ListTree,
  Network,
  Puzzle,
  Waypoints,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { makePlaceholderView as placeholderView } from "@/components/organisms/shared/make-placeholder-view";
import type { OrganismLandingView, OrganismViewKey } from "@/components/organisms/types";

export interface DefaultViewDescriptor {
  key: OrganismViewKey;
  label: string;
  icon: ReactNode;
  description?: string;
}

export const defaultViewDescriptors: readonly DefaultViewDescriptor[] = [
  { key: "overview", label: "Overview", icon: <Blocks /> },
  {
    key: "phylogeny",
    label: "Phylogeny",
    icon: <Network />,
    description: "Phylogeny data and visualization are planned for a follow-up view.",
  },
  {
    key: "taxa-tree",
    label: "Taxa Tree",
    icon: <ListTree />,
    description: "Taxa Tree browsing is stubbed while the overview data panels are brought online.",
  },
  {
    key: "genomes",
    label: "Genomes",
    icon: <Dna />,
    description: "Genome table filtering and pagination are planned for a dedicated follow-up view.",
  },
  { key: "sequences", label: "Sequences", icon: <Database /> },
  { key: "features", label: "Features", icon: <Binary /> },
  { key: "protein-structures", label: "Protein Structures", icon: <Waypoints /> },
  { key: "domains-and-motifs", label: "Domains and Motifs", icon: <Puzzle /> },
  { key: "epitopes", label: "Epitopes", icon: <Activity /> },
  { key: "experiments", label: "Experiments", icon: <FlaskConical /> },
  { key: "interactions", label: "Interactions", icon: <Handshake /> },
];

export type NavItemOverride =
  | { Component: ComponentType }
  | { description?: string };

export type NavItemOverrides = Partial<Record<OrganismViewKey, NavItemOverride>>;

interface BuildOrganismNavItemsOptions {
  exclude?: readonly OrganismViewKey[];
}

export function buildOrganismNavItems(
  overrides: NavItemOverrides = {},
  options: BuildOrganismNavItemsOptions = {},
): OrganismLandingView[] {
  const excluded = new Set(options.exclude ?? []);
  return defaultViewDescriptors
    .filter((descriptor) => !excluded.has(descriptor.key))
    .map((descriptor) => {
      const override = overrides[descriptor.key];
      if (override && "Component" in override) {
        return {
          key: descriptor.key,
          label: descriptor.label,
          icon: descriptor.icon,
          Component: override.Component,
        };
      }
      const description =
        override && "description" in override
          ? override.description
          : descriptor.description;
      return {
        key: descriptor.key,
        label: descriptor.label,
        icon: descriptor.icon,
        Component: placeholderView(descriptor.label, description),
      };
    });
}
