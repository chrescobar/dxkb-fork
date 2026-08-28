"use client";

import { Suspense, useRef, useState } from "react";
import type { RowSelectionState } from "@tanstack/react-table";

import { ResourceWorkspace } from "@/components/views/resource-workspace";
import { GenomeDetailPanel } from "@/components/genome/genome-detail-panel";
import { ListData } from "@/components/services/list-data";
import { SearchActionBar } from "@/components/search/search-action-bar";
import {
  featureHref,
  featureIdFromRow,
  genomeHref,
  genomeIdFromRow,
} from "@/lib/views/hrefs";

interface TaxonDataPanelProps {
  resource: string;
  q: string;
  guideUrl?: string;
  /** Notify-only: lets a caller observe the complete RQL filter. */
  onFilterChange?: (rql: string) => void;
  keywordValue?: string;
  onKeywordChange?: (value: string) => void;
}

export function TaxonDataPanel({
  resource,
  q,
  guideUrl,
  onFilterChange,
  keywordValue,
  onKeywordChange,
}: TaxonDataPanelProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [isAllPagesSelected, setIsAllPagesSelected] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedGenomeId, setSelectedGenomeId] = useState<string | null>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  // Debounce empty-selection by 120ms so the panel doesn't flicker when
  // clicking rapidly between rows (mirrors TypeSearch.activeGenomeId logic).
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSelectionChange(ids: string[]) {
    setSelectedIds(ids);
    if (ids.length > 0) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setActiveId(ids[ids.length - 1] ?? null);
    } else {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setActiveId(null);
      }, 120);
    }
  }

  return (
    <ResourceWorkspace
      hasSidePanel={!!activeId}
      actionBar={
        <SearchActionBar
          selectedCount={isAllPagesSelected ? totalItems : selectedIds.length}
          searchType={resource}
          guideUrl={guideUrl}
          onAction={(actionId) => {
            if (actionId === "genome" && selectedGenomeId) {
              window.open(
                genomeHref(selectedGenomeId),
                "_blank",
                "noopener,noreferrer",
              );
            } else if (actionId === "feature" && selectedFeatureId) {
              window.open(
                featureHref(selectedFeatureId),
                "_blank",
                "noopener,noreferrer",
              );
            }
          }}
        />
      }
      sidePanel={
        <GenomeDetailPanel
          genomeId={activeId}
          activeTab={resource}
          selectedIds={selectedIds}
          isAllPagesSelected={isAllPagesSelected}
          totalItems={totalItems}
        />
      }
    >
      <Suspense
        fallback={
          <div className="size-full animate-pulse rounded-lg bg-muted" />
        }
      >
        <ListData
          resource={resource}
          q={q}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
          onSelectedRowChange={(row) => {
            setSelectedGenomeId(genomeIdFromRow(row));
            setSelectedFeatureId(featureIdFromRow(row));
          }}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          isAllPagesSelected={isAllPagesSelected}
          onAllPagesSelectionChange={setIsAllPagesSelected}
          onTotalItemsChange={setTotalItems}
          onFilterChange={onFilterChange}
          keywordValue={keywordValue}
          onKeywordChange={onKeywordChange}
        />
      </Suspense>
    </ResourceWorkspace>
  );
}
