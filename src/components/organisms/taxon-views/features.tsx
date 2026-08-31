import { taxonLineageClause, type TaxonViewScope } from "./scope";
import { TaxonDataPanel } from "./taxon-data-panel";

export function makeFeaturesView({ scope }: { scope: TaxonViewScope }) {
  function FeaturesView() {
    return (
      <TaxonDataPanel
        resource="genome_feature"
        q={`and(eq(genome_id,*),genome(and(${taxonLineageClause(scope)},ne(genome_status,Deprecated))),eq(annotation,PATRIC))`}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/features.html"
      />
    );
  }
  return FeaturesView;
}
