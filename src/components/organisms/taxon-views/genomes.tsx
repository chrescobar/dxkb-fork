import { taxonLineageClause, type TaxonViewScope } from "./scope";
import { TaxonDataPanel } from "./taxon-data-panel";

export function makeGenomesView({ scope }: { scope: TaxonViewScope }) {
  function GenomesView() {
    return (
      <TaxonDataPanel
        resource="genome"
        q={taxonLineageClause(scope)}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/genome_table.html"
      />
    );
  }
  return GenomesView;
}
