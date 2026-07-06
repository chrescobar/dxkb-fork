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
  // No wrapper div: the shell's fill region already bounds height
  // (flex-1 min-h-0 overflow-hidden), and GenomeShell wraps its children in a
  // flex-col overflow-hidden box of its own. Extra wrappers only risk breaking
  // the min-h-0 chain.
  return (
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
      <TaxonomyTree rootTaxon={taxon} onSelect={setSelectedRows} />
    </GenomeShell>
  );
}
