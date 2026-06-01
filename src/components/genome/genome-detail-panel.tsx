"use client";

import { useQuery } from "@tanstack/react-query";
import { InfoPanel } from "@/components/detail-panel/info-panel";

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

  const idFieldMap: Record<string, string> = {
    genome: "genome_id",
    genome_sequence: "sequence_id",
    genome_feature: "patric_id",
    strain: "strain",
    epitope: "epitope_id",
    protein_structure: "pdb_id",
    taxonomy: "taxon_id",
    experiment: "exp_id",
    bioset: "bioset_id",
  };

  const hasSelection = selectedIds.length > 0;

  // Only fetch when exactly ONE row is selected
  const { data: selectedRow, isLoading } = useQuery({
    queryKey: ["selected-row", activeTab, genomeId],
    enabled: !!genomeId && selectedIds.length === 1,

    queryFn: async () => {
      if (!genomeId) return null;

      const idField = idFieldMap[activeTab] ?? "id";

      const res = await fetch(
        `${DataAPI}/${activeTab}/?eq(${idField},${genomeId})`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch selected row");
      }

      const data = await res.json();

      // normalize different API shapes
      const row =
        Array.isArray(data)
          ? data[0]
          : data?.items?.[0] ??
            data?.response?.docs?.[0] ??
            null;

      return row;
    },
  });

  if (!hasSelection) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No rows selected
      </div>
    );
  }

    return (
        <div className="flex flex-col min-h-0 flex-1">
            <div className="flex-1 min-h-0 overflow-y-auto bg-background text-foreground shadow-md">
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