import type { EntityViewTab } from "@/components/views";

export const serologyTabKeys = ["overview"] as const;
export type SerologyTab = (typeof serologyTabKeys)[number];

export function parseSerologyTab(
  value: string | string[] | undefined,
): SerologyTab {
  const tab = Array.isArray(value) ? value[0] : value;
  return tab === "overview" ? tab : "overview";
}

export const serologyTabs: readonly EntityViewTab<SerologyTab>[] = [
  { key: "overview", label: "Overview" },
];
