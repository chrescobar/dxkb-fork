import { taxonomySequenceRql } from "@/lib/views/child-resources";
import { taxonLineageClause, type TaxonViewScope } from "./scope";
import { TaxonDataPanel } from "./taxon-data-panel";

export function makeSequencesView({ scope }: { scope: TaxonViewScope }) {
  function SequencesView() {
    return (
      <TaxonDataPanel
        resource="genome_sequence"
        q={taxonomySequenceRql(taxonLineageClause(scope))}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/sequences.html"
      />
    );
  }
  return SequencesView;
}
