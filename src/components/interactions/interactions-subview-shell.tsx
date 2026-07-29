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
  // The Table subtab (TaxonDataPanel -> ListData -> FilterBar) must stay
  // self-managing — FilterBar owns its own keywords/selected state and
  // re-emits an empty RQL on every mount, so a filter value fed back down as
  // a controlled prop gets stomped the instant the subtree remounts. Fixing
  // that requires the subtree to never remount at all: `keepMounted` on the
  // Table panel keeps its own state (filter, pagination, sorting, selection)
  // alive across the switch, and this `tableFilter` is a read-only mirror the
  // shell observes via onFilterChange, not a value it feeds back — just
  // enough for the Graph subview to reflect the same active filter.
  //
  // Graph does NOT get keepMounted: base-ui mounts a keepMounted panel
  // immediately regardless of which tab is active, which would fire the
  // (potentially thousands-of-rows) PPI fetch on every page load even for
  // users who never open Graph. Graph's own keyword box is a net-new feature
  // with no prior persistence behavior to preserve, so resetting it on
  // revisit is acceptable — unlike Table's filter, which is user-reported
  // regression territory.
  const [tableFilter, setTableFilter] = useState("");

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
      <TabsContent value="table" keepMounted className="flex min-h-0 flex-1 flex-col">
        <TaxonDataPanel resource="ppi" q={q} guideUrl={guideUrl} onFilterChange={setTableFilter} />
      </TabsContent>
      <TabsContent value="graph" className="flex min-h-0 flex-1 flex-col">
        <InteractionsGraph taxonId={taxonId} q={q} tableFilter={tableFilter} />
      </TabsContent>
    </Tabs>
  );
}
