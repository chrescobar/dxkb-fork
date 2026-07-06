import { Suspense } from "react";

import { ListData } from "@/components/services/list-data";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

export function makeSerologyView({ taxon }: { taxon: OrganismTaxonomy | null }) {
  function SerologyView() {
    if (!taxon) return null;
    return (
      <Suspense
        fallback={<div className="p-8 text-sm text-muted-foreground">Loading serology data…</div>}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <ListData
            resource="serology"
            q={`eq(taxon_lineage_ids,${String(taxon.taxonId)})`}
          />
        </div>
      </Suspense>
    );
  }
  return SerologyView;
}
