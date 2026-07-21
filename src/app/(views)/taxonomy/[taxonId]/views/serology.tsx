import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import { TaxonDataPanel } from "../_components/taxon-data-panel";

export function makeSerologyView({ taxon }: { taxon: OrganismTaxonomy | null }) {
  function SerologyView() {
    if (!taxon) return null;
    return (
      <TaxonDataPanel
        resource="serology"
        q={`eq(taxon_lineage_ids,${String(taxon.taxonId)})`}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/serology_data.html"
      />
    );
  }
  return SerologyView;
}
