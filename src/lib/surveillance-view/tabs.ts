import type { EntityViewTab } from "@/components/views";

export const surveillanceTabKeys = ["overview"] as const;
export type SurveillanceTab = (typeof surveillanceTabKeys)[number];

export function parseSurveillanceTab(
  value: string | string[] | undefined,
): SurveillanceTab {
  const tab = Array.isArray(value) ? value[0] : value;
  return tab === "overview" ? tab : "overview";
}

export const surveillanceTabs: readonly EntityViewTab<SurveillanceTab>[] = [
  { key: "overview", label: "Overview" },
];
