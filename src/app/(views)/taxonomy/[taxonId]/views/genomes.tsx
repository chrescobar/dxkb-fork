import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import { TaxonDataPanel } from "../_components/taxon-data-panel";

export function makeGenomesView({ taxon }: { taxon: OrganismTaxonomy | null }) {
  function GenomesView() {
    if (!taxon) return null;
    return (
      <TaxonDataPanel
        resource="genome"
        q={`eq(taxon_lineage_ids,${String(taxon.taxonId)})`}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/genome_table.html"
      />
    );
  }
  return GenomesView;
}
