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
    queryKey: ["selected-row", activeTab, genomeId],
    enabled: !!genomeId && selectedIds.length === 1,

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

      // normalize different API shapes
      const row: unknown =
        Array.isArray(data)
          ? data[0]
          : (data as { items?: unknown[] }).items?.[0] ??
            (data as { response?: { docs?: unknown[] } }).response?.docs?.[0] ??
            null;

      return row as Record<string, unknown> | null;
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