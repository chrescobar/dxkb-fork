import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import { TaxonDataPanel } from "../_components/taxon-data-panel";

export function makeStrainsView({ taxon }: { taxon: OrganismTaxonomy | null }) {
  function StrainsView() {
    if (!taxon) return null;
    return (
      <TaxonDataPanel
        resource="strain"
        q={`eq(taxon_lineage_ids,${String(taxon.taxonId)})`}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/strains.html"
      />
    );
  }
  return StrainsView;
}
