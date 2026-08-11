import { taxonLineageClause, type TaxonViewScope } from "./scope";
import { TaxonDataPanel } from "./taxon-data-panel";

export function makeProteinStructuresView({ scope }: { scope: TaxonViewScope }) {
  function ProteinStructuresView() {
    return (
      <TaxonDataPanel
        resource="protein_structure"
        q={`and(eq(genome_id,*),genome(and(${taxonLineageClause(scope)},ne(genome_status,Deprecated))))`}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/protein_structures.html"
      />
    );
  }
  return ProteinStructuresView;
}
