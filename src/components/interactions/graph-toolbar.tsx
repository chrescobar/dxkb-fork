"use client";

import { KeywordSearch } from "@/components/filterbar/keyword-search";

interface GraphToolbarProps {
  filterValue: string;
  onFilterChange: (value: string) => void;
}

export function GraphToolbar({ filterValue, onFilterChange }: GraphToolbarProps) {
  return (
    <div className="mt-0 mb-2 flex flex-wrap items-center gap-2 p-1">
      <KeywordSearch value={filterValue} onChange={onFilterChange} />
    </div>
  );
}
