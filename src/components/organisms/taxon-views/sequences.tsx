import { taxonLineageClause, type TaxonViewScope } from "./scope";
import { TaxonDataPanel } from "./taxon-data-panel";

export function makeSequencesView({ scope }: { scope: TaxonViewScope }) {
  function SequencesView() {
    return (
      <TaxonDataPanel
        resource="genome_sequence"
        q={`and(eq(genome_id,*),genome(and(${taxonLineageClause(scope)},ne(genome_status,Deprecated))))`}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/sequences.html"
      />
    );
  }
  return SequencesView;
}
