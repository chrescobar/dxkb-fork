"use client";

import { useQuery } from "@tanstack/react-query";
import { InfoPanel } from "@/components/detail-panel/info-panel";
import { getIdField } from "@/constants/resources";

interface GenomeDetailPanelProps {
  genomeId: string | null;
  activeTab: string;
  selectedIds: string[];
  isAllPagesSelected?: boolean;
  totalItems?: number;
}

/**
 * Shared query key for the detail-panel row fetch. Both the setter
 * (list-data.tsx → setQueryData) and the reader (useQuery here) must use this
 * function so a key change in one place can't silently break cache pre-population.
 */
export function detailPanelQueryKey(resource: string, id: string) {
  return ["selected-row", resource, id] as const;
}

/**
 * Normalize the several row-list shapes the data API returns (bare array,
 * `{items}`, or Solr `{response:{docs}}`) down to the first row, or `null` when
 * empty. Must never return `undefined` — TanStack Query rejects an `undefined`
 * queryFn result (e.g. an empty array from an id that matches no row in the
 * queried core).
 */
export function firstRowFromApiShape(
  data: unknown[] | { items?: unknown[]; response?: { docs?: unknown[] } },
): Record<string, unknown> | null {
  const row: unknown = Array.isArray(data)
    ? data[0]
    : data.items?.[0] ?? data.response?.docs?.[0];
  return (row ?? null) as Record<string, unknown> | null;
}

export function GenomeDetailPanel({
  genomeId,
  activeTab,
  selectedIds,
  isAllPagesSelected,
  totalItems,
}: GenomeDetailPanelProps) {
  const DataAPI = process.env.NEXT_PUBLIC_DATA_API;

  const hasSelection = selectedIds.length > 0;

  // Only fetch when exactly ONE row is selected
  const { data: selectedRow, isLoading, error } = useQuery({
    queryKey: detailPanelQueryKey(activeTab, genomeId ?? ""),
    enabled: !!genomeId && selectedIds.length === 1,
    staleTime: 5 * 60 * 1000,

    queryFn: async () => {
      if (!genomeId) return null;

      const idField = getIdField(activeTab);

      const res = await fetch(
        `${DataAPI ?? ""}/${activeTab}/?eq(${idField},${encodeURIComponent(genomeId)})`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch selected row");
      }

      const data = await res.json() as unknown[] | { items?: unknown[]; response?: { docs?: unknown[] } };

      return firstRowFromApiShape(data);
    },
  });

  if (!hasSelection) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No rows selected
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        {error.message}
      </div>
    );
  }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto bg-background text-foreground shadow-md">
            <InfoPanel
                variant="search"
                activeTab={activeTab}
                selectedIds={selectedIds}
                selectedRow={selectedRow}
                isLoading={isLoading}
                isAllPagesSelected={isAllPagesSelected}
                totalItems={totalItems}
            />
            </div>
        </div>
    );
}