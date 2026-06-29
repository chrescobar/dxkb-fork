import { GitBranch, Radar, Shuffle, TestTube } from "lucide-react";
import type { ComponentType } from "react";

import { makePlaceholderView } from "@/components/organisms/shared/make-placeholder-view";
import {
  defaultViewDescriptors,
  type DefaultViewDescriptor,
} from "@/components/organisms/shared/default-nav-items";
import type { OrganismLandingView, OrganismViewKey } from "@/components/organisms/types";

import {
  hasBacterialOrViralPhylogeny,
  hasSerology,
  hasSfvt,
  hasStrains,
  hasSurveillance,
  isBacteria,
} from "./predicates";
import type { TabContext } from "./tab-context";

// Four taxon-view-only tabs not present on the shared category-page descriptor
// list. Kept here so the shared list (and the /organisms/* pages) stay at 16.
const extraViewDescriptors: readonly DefaultViewDescriptor[] = [
  { key: "strains", label: "Strains", icon: <GitBranch /> },
  { key: "surveillance", label: "Surveillance", icon: <Radar /> },
  { key: "serology", label: "Serology", icon: <TestTube /> },
  { key: "sfvt", label: "SFVT", icon: <Shuffle /> },
];

const descriptorByKey = new Map<OrganismViewKey, DefaultViewDescriptor>(
  [...defaultViewDescriptors, ...extraViewDescriptors].map((d) => [d.key, d]),
);

// Display order for the 15-tab taxon strip (biological grouping).
const taxonTabOrder: readonly OrganismViewKey[] = [
  "overview", "phylogeny", "taxonomy", "strains", "genomes",
  "sequences", "features", "protein-structures",
  "domains-and-motifs", "sfvt", "epitopes", "experiments",
  "surveillance", "serology", "interactions",
];

interface Gate {
  enabled: (ctx: TabContext) => boolean;
  disabledReason: string;
}

// Only conditional tabs appear here; any key absent from this map is baseline
// (always enabled). Phylogeny is one label over two gates (bacterial OR viral).
const gatesByKey: Partial<Record<OrganismViewKey, Gate>> = {
  phylogeny: { enabled: hasBacterialOrViralPhylogeny, disabledReason: "No phylogenetic tree available for this taxon." },
  interactions: { enabled: isBacteria, disabledReason: "Interaction data applies to bacterial taxa." },
  strains: { enabled: hasStrains, disabledReason: "Strains apply to segmented-genome viruses." },
  surveillance: { enabled: hasSurveillance, disabledReason: "No surveillance data for this pathogen." },
  serology: { enabled: hasSerology, disabledReason: "No serology data for this pathogen." },
  sfvt: { enabled: hasSfvt, disabledReason: "Sequence Feature Variant Types are not curated for this taxon." },
};

export type TabPolicyOverride =
  | { Component: ComponentType }
  | { description?: string };

export type TabPolicyOverrides = Partial<Record<OrganismViewKey, TabPolicyOverride>>;

function resolveComponent(
  descriptor: DefaultViewDescriptor,
  override: TabPolicyOverride | undefined,
): ComponentType {
  if (override && "Component" in override) return override.Component;
  const description =
    override && "description" in override ? override.description : descriptor.description;
  return makePlaceholderView(descriptor.label, description);
}

/**
 * Evaluate the full tab policy against a TabContext. Returns all 20 tabs in
 * fixed order; each conditional tab whose gate fails is marked `enabled: false`
 * with a `disabledReason`. Baseline tabs are always enabled. Override semantics
 * mirror buildOrganismNavItems (swap Component, or rewrite placeholder copy).
 */
export function resolveTabs(
  ctx: TabContext,
  overrides: TabPolicyOverrides = {},
): OrganismLandingView[] {
  return taxonTabOrder.map((key): OrganismLandingView => {
    const descriptor = descriptorByKey.get(key);
    if (!descriptor) {
      throw new Error(`tab-policy: no descriptor registered for view key "${key}"`);
    }
    const gate = gatesByKey[key];
    const enabled = gate ? gate.enabled(ctx) : true;
    const view: OrganismLandingView = {
      key,
      label: descriptor.label,
      icon: descriptor.icon,
      Component: resolveComponent(descriptor, overrides[key]),
      enabled,
    };
    if (!enabled && gate) view.disabledReason = gate.disabledReason;
    return view;
  });
}
