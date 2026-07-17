import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import { TaxonDataPanel } from "../_components/taxon-data-panel";

export function makeProteinStructuresView({ taxon }: { taxon: OrganismTaxonomy | null }) {
  function ProteinStructuresView() {
    if (!taxon) return null;
    return (
      <TaxonDataPanel
        resource="protein_structure"
        q={`and(eq(genome_id,*),genome(and(eq(taxon_lineage_ids,${String(taxon.taxonId)}),ne(genome_status,Deprecated))))`}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/protein_structures.html"
      />
    );
  }
  return ProteinStructuresView;
}
