import { taxonLineageClause, type TaxonViewScope } from "./scope";
import { TaxonDataPanel } from "./taxon-data-panel";

export function makeSerologyView({ scope }: { scope: TaxonViewScope }) {
  function SerologyView() {
    return (
      <TaxonDataPanel
        resource="serology"
        q={taxonLineageClause(scope)}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/serology_data.html"
      />
    );
  }
  return SerologyView;
}
