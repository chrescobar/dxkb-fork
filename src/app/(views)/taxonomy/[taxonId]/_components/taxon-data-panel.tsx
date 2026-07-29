"use client";

import { useRef, useState } from "react";

import { GenomeShell } from "@/components/genome/genome-shell";
import { GenomeDetailPanel } from "@/components/genome/genome-detail-panel";
import { ListData } from "@/components/services/list-data";
import { SearchActionBar } from "@/components/search/search-action-bar";

interface TaxonDataPanelProps {
  resource: string;
  q: string;
  guideUrl?: string;
  /**
   * Notify-only: lets a caller observe this panel's filter without owning it.
   * ListData stays uncontrolled here (no `filter` prop passed through) since
   * the panel must keep driving its own query from internal FilterBar state —
   * see interactions-subview-shell.tsx for why (that state has to survive a
   * tab-switch remount, which a controlled prop can't do on its own).
   */
  onFilterChange?: (rql: string) => void;
}

export function TaxonDataPanel({ resource, q, guideUrl, onFilterChange }: TaxonDataPanelProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [isAllPagesSelected, setIsAllPagesSelected] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Debounce empty-selection by 120ms so the panel doesn't flicker when
  // clicking rapidly between rows (mirrors TypeSearch.activeGenomeId logic).
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSelectionChange(ids: string[]) {
    setSelectedIds(ids);
    if (ids.length > 0) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setActiveId(ids[ids.length - 1] ?? null);
    } else {
      debounceRef.current = setTimeout(() => { setActiveId(null); }, 120);
    }
  }

  return (
    <GenomeShell
      hasSidePanel={!!activeId}
      actionBar={
        <SearchActionBar
          selectedCount={isAllPagesSelected ? totalItems : selectedIds.length}
          searchType={resource}
          guideUrl={guideUrl}
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
      <ListData
        resource={resource}
        q={q}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        pageIndex={pageIndex}
        onPageChange={setPageIndex}
        isAllPagesSelected={isAllPagesSelected}
        onAllPagesSelectionChange={setIsAllPagesSelected}
        onTotalItemsChange={setTotalItems}
        onFilterChange={onFilterChange}
      />
    </GenomeShell>
  );
}
