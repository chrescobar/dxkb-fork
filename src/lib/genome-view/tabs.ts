import type { EntityViewTab } from "@/components/views";
import type { GenomeViewRecord } from "./schema";

export const genomeTabKeys = [
  "overview",
  "sequences",
  "interactions",
  "genome-browser",
  "features",
  "proteins",
  "domains",
  "structures",
  "experiments",
] as const;
export type GenomeTab = (typeof genomeTabKeys)[number];

export function parseGenomeTab(
  value: string | string[] | undefined,
): GenomeTab {
  const tab = Array.isArray(value) ? value[0] : value;
  return genomeTabKeys.includes(tab as GenomeTab)
    ? (tab as GenomeTab)
    : "overview";
}

export function isBacterialGenome(genome: GenomeViewRecord): boolean {
  return genome.superkingdom?.toLowerCase() === "bacteria";
}

export function buildGenomeTabs(
  genome: GenomeViewRecord,
): readonly EntityViewTab<GenomeTab>[] {
  const bacterial = isBacterialGenome(genome);
  return [
    { key: "overview", label: "Overview" },
    { key: "sequences", label: "Sequences" },
    {
      key: "interactions",
      label: "Interactions",
      enabled: bacterial,
      disabledReason: bacterial
        ? undefined
        : "Interactions are currently available for bacterial genomes only.",
    },
    {
      key: "genome-browser",
      label: "Genome Browser",
      enabled: false,
      disabledReason: "A supported modern genome browser is not yet available.",
    },
    {
      key: "features",
      label: "Features",
      enabled: false,
      disabledReason: "Available after the Feature view is implemented.",
    },
    {
      key: "proteins",
      label: "Proteins",
      enabled: false,
      disabledReason: "Depends on the Feature view contract.",
    },
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
    {
      key: "experiments",
      label: "Experiments",
      enabled: false,
      disabledReason: "The Experiment view is not yet implemented.",
    },
  ];
}

export function canonicalGenomeTab(
  requested: string | string[] | undefined,
  genome: GenomeViewRecord,
): GenomeTab {
  const tab = parseGenomeTab(requested);
  return buildGenomeTabs(genome).find((item) => item.key === tab)?.enabled ===
    false
    ? "overview"
    : tab;
}
