import type { EntityViewTab } from "@/components/views";
import type { FeatureViewRecord } from "./schema";

export const featureTabKeys = [
  "overview",
  "genome-browser",
  "compare-region",
  "transcriptomics",
  "interactions",
  "domains",
  "structures",
] as const;
export type FeatureTab = (typeof featureTabKeys)[number];

export function parseFeatureTab(value: string | string[] | undefined): FeatureTab {
  const tab = Array.isArray(value) ? value[0] : value;
  return featureTabKeys.includes(tab as FeatureTab)
    ? (tab as FeatureTab)
    : "overview";
}

export function buildFeatureTabs(
  feature: FeatureViewRecord,
): readonly EntityViewTab<FeatureTab>[] {
  const hasInteractionId = Boolean(feature.feature_id);
  return [
    { key: "overview", label: "Overview" },
    {
      key: "genome-browser",
      label: "Genome Browser",
      enabled: false,
      disabledReason: "A supported modern genome browser is not yet available.",
    },
    {
      key: "compare-region",
      label: "Compare Region Viewer",
      enabled: false,
      disabledReason: "A supported compare-region data contract is not yet available.",
    },
    {
      key: "transcriptomics",
      label: "Transcriptomics",
      enabled: false,
      disabledReason: "Feature-scoped transcriptomics is not yet available.",
    },
    { key: "interactions", label: "Interactions", enabled: hasInteractionId },
    {
      key: "domains",
      label: "Domains and Motifs",
      enabled: false,
      disabledReason: "The Domains and Motifs view is not yet implemented.",
    },
    {
      key: "structures",
      label: "Protein Structures",
      enabled: false,
      disabledReason: "The Protein Structure view is not yet implemented.",
    },
  ];
}

export function canonicalFeatureTab(
  requested: string | string[] | undefined,
  feature: FeatureViewRecord,
): FeatureTab {
  const tab = parseFeatureTab(requested);
  return buildFeatureTabs(feature).find((item) => item.key === tab)?.enabled === false
    ? "overview"
    : tab;
}
