"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InfoPanel } from "@/components/detail-panel/info-panel";

interface WithGenomePanelProps {
  children: (props: {
    activeTab: string;
    setActiveTab: (tab: string) => void;
  }) => React.ReactNode;

  tabs: string[];

  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
}

export function WithGenomePanel({
  children,
  tabs,
  activeTab: incomingTab,
  selectedIds,
}: WithGenomePanelProps) {
  const initialTab =
    incomingTab && tabs.includes(incomingTab) ? incomingTab : tabs[0];

  const [activeTab, setActiveTab] = useState(initialTab);

  const hasSelection = selectedIds.length > 0;

  const DataAPI = process.env.NEXT_PUBLIC_DATA_API!;

  // ✅ Fetch ONLY when exactly one row is selected
  const { data: selectedRow, isLoading } = useQuery({
    queryKey: ["selected-row", activeTab, selectedIds[0]],
    queryFn: async () => {
      const id = selectedIds[0];
      if (!id) return null;

      const res = await fetch(
        `${DataAPI}/${activeTab}/?eq(id,${id})`
      );

      if (!res.ok) throw new Error("Failed to fetch selected row");

      const data = await res.json();

      // normalize response
      const row =
        Array.isArray(data) ? data[0] :
        data?.items?.[0] ??
        data?.response?.docs?.[0] ??
        null;

      return row;
    },
    enabled: selectedIds.length === 1, // 🔑 ONLY fetch for single select
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-[10px] mt-[10px]">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div
          className={`flex min-h-0 flex-col overflow-hidden ${
            hasSelection ? "w-[80%]" : "w-full"
          }`}
        >
          {children({ activeTab, setActiveTab })}
        </div>

        {hasSelection && (
          <div className="flex w-[20%] min-h-0 flex-col overflow-hidden bg-background text-foreground shadow-md">
            <InfoPanel
              variant="search"
              activeTab={activeTab}
              selectedIds={selectedIds}
              selectedRow={selectedRow}  
              isLoading={isLoading}      
            />
          </div>
        )}
      </div>
    </div>
  );
}