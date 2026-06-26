import { Suspense } from "react";

import { ListData } from "@/components/services/list-data";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

export function makeSurveillanceView({ taxon }: { taxon: OrganismTaxonomy | null }) {
  function SurveillanceView() {
    if (!taxon) return null;
    return (
      <Suspense
        fallback={<div className="p-8 text-sm text-muted-foreground">Loading surveillance data…</div>}
      >
        <div className="flex h-[calc(100vh-12rem)] flex-col overflow-hidden">
          <ListData
            resource="surveillance"
            q={`eq(taxon_lineage_ids,${String(taxon.taxonId)})`}
          />
        </div>
      </Suspense>
    );
  }
  return SurveillanceView;
}
