import { taxonLineageClause, type TaxonViewScope } from "./scope";
import { TaxonDataPanel } from "./taxon-data-panel";

export function makeSurveillanceView({ scope }: { scope: TaxonViewScope }) {
  function SurveillanceView() {
    return (
      <TaxonDataPanel
        resource="surveillance"
        q={taxonLineageClause(scope)}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/surveillance_data.html"
      />
    );
  }
  return SurveillanceView;
}
