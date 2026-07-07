"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { GenomeShell } from "@/components/genome/genome-shell";
import { InfoPanel } from "@/components/detail-panel/info-panel";
import {
  SearchActionBar,
  notReady,
  type SearchActionId,
} from "@/components/search/search-action-bar";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

import { TaxonomyTree } from "./taxonomy-tree";
import type { TaxonRecord } from "./taxon-tree-types";

const taxonomyGuideUrl =
  "https://bv-brc.org/docs/quick_references/organisms_taxon/taxonomy.html";

/**
 * Client shell for the taxonomy tab: the tree plus a detail panel for the
 * selected node. Kept separate from the make…View factory so the factory module
 * stays server-callable (buildTaxonomyNavItems invokes it during SSR), and so
 * GenomeShell's resizable panels (which need ResizeObserver) live outside the
 * tree's jsdom unit tests.
 */
export function TaxonomyTreePanel({ taxon }: { taxon: OrganismTaxonomy }) {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<TaxonRecord[]>([]);
  const singleRow = selectedRows.length === 1 ? selectedRows[0] : null;

  function handleAction(actionId: SearchActionId) {
    // Only taxonOverview is live; the rest are disabled in the bar (see
    // disabledActions / module notReady) so they never reach here.
    if (actionId === "taxonOverview" && singleRow) {
      router.push(`/taxonomy/${String(singleRow.taxon_id)}?tab=overview`);
    }
  }

  // No wrapper div: the shell's fill region already bounds height
  // (flex-1 min-h-0 overflow-hidden), and GenomeShell wraps its children in a
  // flex-col overflow-hidden box of its own. Extra wrappers only risk breaking
  // the min-h-0 chain.
  return (
    <GenomeShell
      hasSidePanel={selectedRows.length > 0}
      actionBar={
        <SearchActionBar
          selectedCount={selectedRows.length}
          searchType="taxonomy"
          guideUrl={taxonomyGuideUrl}
          // Genomes + Features routing lands later; show them disabled for now.
          // Services stays disabled via its module-level notReady flag.
          disabledActions={{ genomes: notReady, features: notReady }}
          onAction={handleAction}
        />
      }
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
