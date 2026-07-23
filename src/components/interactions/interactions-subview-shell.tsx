"use client";

import { useState } from "react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TaxonDataPanel } from "@/app/(views)/taxonomy/[taxonId]/_components/taxon-data-panel";

import { InteractionsGraph } from "./interactions-graph";

interface InteractionsSubviewShellProps {
  taxonId: number;
  q: string;
  guideUrl?: string;
}

export function InteractionsSubviewShell({ taxonId, q, guideUrl }: InteractionsSubviewShellProps) {
  const [subTab, setSubTab] = useState<"table" | "graph">("table");

  return (
    <Tabs
      value={subTab}
      onValueChange={(value) => { setSubTab(value as "table" | "graph"); }}
      className="flex h-full min-h-0 flex-col"
    >
      <TabsList className="w-fit shrink-0">
        <TabsTrigger value="table">Table</TabsTrigger>
        <TabsTrigger value="graph">Graph</TabsTrigger>
      </TabsList>
      <TabsContent value="table" className="min-h-0 flex-1">
        <TaxonDataPanel resource="ppi" q={q} guideUrl={guideUrl} />
      </TabsContent>
      <TabsContent value="graph" className="min-h-0 flex-1">
        <InteractionsGraph taxonId={taxonId} q={q} />
      </TabsContent>
    </Tabs>
  );
}
