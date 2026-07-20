import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import { TaxonDataPanel } from "../_components/taxon-data-panel";

export function makeEpitopesView({ taxon }: { taxon: OrganismTaxonomy | null }) {
  function EpitopesView() {
    if (!taxon) return null;
    return (
      <TaxonDataPanel
        resource="epitope"
        q={`eq(taxon_id,${String(taxon.taxonId)})`}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/epitopes.html"
      />
    );
  }
  return EpitopesView;
}
