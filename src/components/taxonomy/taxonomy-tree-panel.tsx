"use client";

import { useState } from "react";

import { GenomeShell } from "@/components/genome/genome-shell";
import { InfoPanel } from "@/components/detail-panel/info-panel";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

import { TaxonomyTree } from "./taxonomy-tree";
import type { TaxonRecord } from "./taxon-tree-types";

/**
 * Client shell for the taxonomy tab: the tree plus a detail panel for the
 * selected node. Kept separate from the make…View factory so the factory module
 * stays server-callable (buildTaxonomyNavItems invokes it during SSR), and so
 * GenomeShell's resizable panels (which need ResizeObserver) live outside the
 * tree's jsdom unit tests.
 */
export function TaxonomyTreePanel({ taxon }: { taxon: OrganismTaxonomy }) {
  const [selectedRows, setSelectedRows] = useState<TaxonRecord[]>([]);
  const singleRow = selectedRows.length === 1 ? selectedRows[0] : null;
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
    <GenomeShell
      hasSidePanel={selectedRows.length > 0}
      sidePanel={
        <InfoPanel
          variant="search"
          activeTab="taxonomy"
          selectedRow={singleRow}
          selectedIds={selectedRows.map(r => String(r.taxon_id))}
        />
      }
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TaxonomyTree rootTaxon={taxon} onSelect={setSelectedRows} />
      </div>
    </GenomeShell>
    </div>
  );
}
