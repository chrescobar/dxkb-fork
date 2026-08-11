"use client";

import { useState } from "react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TaxonDataPanel } from "@/components/organisms/taxon-views/taxon-data-panel";

import { InteractionsGraph } from "./interactions-graph";

interface InteractionsSubviewShellProps {
  taxonId: number;
  q: string;
  guideUrl?: string;
}

export function InteractionsSubviewShell({ taxonId, q, guideUrl }: InteractionsSubviewShellProps) {
  const [subTab, setSubTab] = useState<"table" | "graph">("table");
  // Keep table-only state (facets, pagination, sorting, selection) mounted.
  // Only keyword text is shared because both sibling views expose that input.
  // Graph remains lazy-mounted to avoid fetching its full dataset until opened.
  const [tableFilter, setTableFilter] = useState("");
  const [keywordText, setKeywordText] = useState("");

  return (
    <Tabs
      value={subTab}
      onValueChange={(value) => { setSubTab(value as "table" | "graph"); }}
      className="mt-2.5 flex min-h-0 flex-1 flex-col"
    >
      <TabsList className="w-fit shrink-0">
        <TabsTrigger value="table">Table</TabsTrigger>
        <TabsTrigger value="graph">Graph</TabsTrigger>
      </TabsList>
      <TabsContent
        value="table"
        keepMounted
        inert={subTab !== "table"}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TaxonDataPanel
          resource="ppi"
          q={q}
          guideUrl={guideUrl}
          onFilterChange={setTableFilter}
          keywordValue={keywordText}
          onKeywordChange={setKeywordText}
        />
      </TabsContent>
      <TabsContent value="graph" className="flex min-h-0 flex-1 flex-col">
        <InteractionsGraph
          taxonId={taxonId}
          q={q}
          tableFilter={tableFilter}
          keywordValue={keywordText}
          onKeywordChange={setKeywordText}
        />
      </TabsContent>
    </Tabs>
  );
}
