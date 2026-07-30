"use client";

import { KeywordSearch } from "@/components/filterbar/keyword-search";

interface GraphToolbarProps {
  filterValue: string;
  onFilterChange: (value: string) => void;
}

export function GraphToolbar({ filterValue, onFilterChange }: GraphToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-2">
      <KeywordSearch value={filterValue} onChange={onFilterChange} />
    </div>
  );
}
