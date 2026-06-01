"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ListData } from "@/components/services/list-data";
import { GenomeShell } from "@/components/genome/genome-shell";
import { GenomeDetailPanel } from "@/components/genome/genome-detail-panel";

// ---- Props interface ----
export interface TypeSearchProps {
  q?: string | null;
  searchtype?: string | null;
}

// ---- Type for search types ----
type SearchTypesMap = Record<string, Record<string, string>>;

interface TabsRendererProps {
  activeTab: string;
  setActiveTab: (v: string) => void;
  urlType: string;
  urlQ: string;
  tabsForType: Record<string, string>;
  tablist: string[];
  rowSelection: Record<string, boolean>;
  setRowSelection: (sel: Record<string, boolean>) => void;
  pageIndex: number;
  setPageIndex: (page: number) => void;
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedIds: string[];
  isAllPagesSelected: boolean;
  setIsAllPagesSelected: (selected: boolean) => void;
  totalItems: number;
  setTotalItems: (total: number) => void;
}

// IMPORTANT: This must be defined at module scope (not inside TypeSearch),
// otherwise it gets a new identity on every TypeSearch re-render, which
// remounts the entire subtree and wipes ListData local state (sorting, etc).
function TabsRenderer({
  activeTab,
  setActiveTab,
  urlType,
  urlQ,
  tabsForType,
  tablist,
  rowSelection,
  setRowSelection,
  pageIndex,
  setPageIndex,
  setSelectedIds,
  selectedIds,
  isAllPagesSelected,
  setIsAllPagesSelected,
  setTotalItems,
}: TabsRendererProps) {
  // Whenever urlType (searchtype) changes, set the active tab.
  // If urlType matches one of the tabs (term), set that; otherwise pick the first tab.
  useEffect(() => {
    const desired = urlType ?? "genome";
    const targetTab = tablist.includes(desired) ? desired : tablist[0];
    if (targetTab && targetTab !== activeTab) {
      setActiveTab(targetTab);
    }
    // also, if q changes and there is no searchtype, ensure at least the first tab is active
    if (!urlType && urlQ && tablist[0] !== activeTab) {
      setActiveTab(tablist[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlType, urlQ, tablist.join(",")]);

  const encodedQ = encodeURIComponent(urlQ);
  const fullQ = "keyword(" + encodedQ + ")";

  // Handle tab change - clear selections when switching tabs
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setRowSelection({});
    setSelectedIds([]);
  };

  useEffect(() => {
    // Debug: selectedIds state for development; remove before merging
    // console.log("selectedIds", selectedIds);
  }, [selectedIds]);

  useEffect(() => {
    // Debug: rowSelection state for development; remove before merging
    // console.log("rowSelection", rowSelection);
  }, [rowSelection]);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-1 min-h-0 flex-col overflow-hidden">
      <TabsList className="pb-0 mb-0 bg-background">
        {Object.entries(tabsForType).map(([term, label]) => (
          <TabsTrigger key={term} value={term} className="...">
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      {Object.keys(tabsForType).map((term) => (
        <TabsContent
          key={term}
          value={term}
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden border-0 px-0 pt-[5px]"
        >
          <ListData
            resource={term}
            q={fullQ}
            selectedIds={selectedIds}
            onSelectionChange={(ids) => {
              if (!Array.isArray(ids)) return;

              // Debounce handling of empty selection notifications. Some
              // interactions/firehose events can emit a transient empty
              // selection which would immediately clear the user's
              // cross-page selection; to avoid that we wait briefly before
              // clearing so a follow-up selection can cancel the clear.
              const clearRef = (TabsRenderer as any).__clearTimeoutRef ??= { current: null as number | null };

              // If there is a pending clear, cancel it whenever we get a new event
              if (clearRef.current) {
                window.clearTimeout(clearRef.current);
                clearRef.current = null;
              }

              if (ids.length === 0) {
                // Schedule clearing after a short delay unless another
                // selection arrives.
                clearRef.current = window.setTimeout(() => {
                  setSelectedIds([]);
                  clearRef.current = null;
                }, 120) as unknown as number;
                return;
              }

              // Immediate merge for non-empty updates
              setSelectedIds((prev) => {
                const next = new Set(prev);

                // Add new ones
                ids.forEach((id) => {
                  if (id) next.add(id);
                });

                // Remove ones that are no longer selected on this page
                prev.forEach((id) => {
                  if (!ids.includes(id)) {
                    next.delete(id);
                  }
                });

                return Array.from(next);
              });
            }}            
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            pageIndex={pageIndex}
            onPageChange={setPageIndex}
            isAllPagesSelected={isAllPagesSelected}
            onAllPagesSelectionChange={setIsAllPagesSelected}
            onTotalItemsChange={setTotalItems}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function TypeSearch({ q, searchtype }: TypeSearchProps) {
  const searchParams = useSearchParams();
  
  console.log("TypeSearch render");

  useEffect(() => {
    console.log("TypeSearch mounted");

    return () => {
      console.log("TypeSearch unmounted");
    };
  }, []);

  // Derive URL params directly to avoid extra state + rerender loops.
  const urlQ = q ?? searchParams.get("q") ?? "";
  const urlType = searchtype ?? searchParams.get("searchtype") ?? "";

  // fallback map
  const searchTypes: SearchTypesMap = {
    genome: {
      genome: "Genomes",
      genome_sequence: "Sequences",
      genome_amr: "AMR Phenotypes",
      genome_feature: "Features",
    },
    genome_feature: {
      genome_feature: "Genome Features",
    },
    epitope: {
      epitope: "Epitopes",
    },
    experiment: {
      experiment: "Experiments",
      bioset: "Biosets",
    },
    protein_feature: {
      protein_feature: "Domains and Motifs",
    },
    protein_structure: {
      protein_structure: "Protein Structures",
    },
    serology: {
      serology: "Serology",
    },
    strain: {
      strain: "Strains",
    },
    surveillance: {
      surveillance: "Surveillance",
    },
    taxonomy: {
      taxonomy: "Taxa",
    },
  };

  // Determine which tab group to render based on urlType (thistype)
  const thistype = urlType || "genome";
  const tabsForType = searchTypes[thistype] ?? searchTypes["genome"];
  const tablist = Object.keys(tabsForType);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [isAllPagesSelected, setIsAllPagesSelected] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    setRowSelection({});
    setSelectedIds([]);
    setPageIndex(0);
    setIsAllPagesSelected(false);
    setTotalItems(0);
  }, [urlType, urlQ]);

  const [activeTab, setActiveTab] = useState(tablist[0]);
  // Keep the side panel open for multi-selection: use the last selected id
  // as the active genome shown in the panel. This prevents the panel from
  // collapsing whenever the user selects an additional row while already
  // viewing details.
  const activeGenomeId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;

  // Main return: 
  return (
    <div className="flex min-h-0 flex-1">
      <GenomeShell
        hasSidePanel={!!activeGenomeId}
        sidePanel={
          <GenomeDetailPanel
            genomeId={activeGenomeId}
            activeTab={activeTab}
            selectedIds={selectedIds}
            isAllPagesSelected={isAllPagesSelected}
            totalItems={totalItems}
          />
        }
        >
          <TabsRenderer
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            urlType={urlType}
            urlQ={urlQ}
            tabsForType={tabsForType}
            tablist={tablist}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            pageIndex={pageIndex}
            setPageIndex={setPageIndex}
            setSelectedIds={setSelectedIds}
            selectedIds={selectedIds}
            isAllPagesSelected={isAllPagesSelected}
            setIsAllPagesSelected={setIsAllPagesSelected}
            totalItems={totalItems}
            setTotalItems={setTotalItems}
          />
      </GenomeShell>
    </div>
  );
}