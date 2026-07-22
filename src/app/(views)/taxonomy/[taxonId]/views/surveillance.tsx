import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import { TaxonDataPanel } from "../_components/taxon-data-panel";

export function makeSurveillanceView({ taxon }: { taxon: OrganismTaxonomy | null }) {
  function SurveillanceView() {
    if (!taxon) return null;
    return (
      <TaxonDataPanel
        resource="surveillance"
        q={`eq(taxon_lineage_ids,${String(taxon.taxonId)})`}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/surveillance_data.html"
      />
    );
  }
  return SurveillanceView;
}
