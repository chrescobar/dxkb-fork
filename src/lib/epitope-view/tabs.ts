import type { EntityViewTab } from "@/components/views";

export const epitopeTabKeys = ["overview", "assays"] as const;
export type EpitopeTab = (typeof epitopeTabKeys)[number];

export function parseEpitopeTab(value: string | string[] | undefined): EpitopeTab {
  const tab = Array.isArray(value) ? value[0] : value;
  return epitopeTabKeys.includes(tab as EpitopeTab)
    ? (tab as EpitopeTab)
    : "overview";
}

export const epitopeTabs: readonly EntityViewTab<EpitopeTab>[] = [
  { key: "overview", label: "Overview" },
  { key: "assays", label: "Assays" },
];
