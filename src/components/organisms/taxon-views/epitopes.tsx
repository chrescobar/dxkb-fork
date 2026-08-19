import { taxonLineageClause, type TaxonViewScope } from "./scope";
import { TaxonDataPanel } from "./taxon-data-panel";

export function makeEpitopesView({ scope }: { scope: TaxonViewScope }) {
  function EpitopesView() {
    return (
      <TaxonDataPanel
        resource="epitope"
        q={taxonLineageClause(scope)}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/epitopes.html"
      />
    );
  }
  return EpitopesView;
}
