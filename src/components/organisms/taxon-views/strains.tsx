import { taxonLineageClause, type TaxonViewScope } from "./scope";
import { TaxonDataPanel } from "./taxon-data-panel";

export function makeStrainsView({ scope }: { scope: TaxonViewScope }) {
  function StrainsView() {
    return (
      <TaxonDataPanel
        resource="strain"
        q={taxonLineageClause(scope)}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/strains.html"
      />
    );
  }
  return StrainsView;
}
