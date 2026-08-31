import { EpitopeResourceCollection } from "@/components/views";
import { taxonLineageClause, type TaxonViewScope } from "./scope";

export function makeEpitopesView({ scope }: { scope: TaxonViewScope }) {
  function EpitopesView() {
    return (
      <EpitopeResourceCollection
        baseRql={taxonLineageClause(scope)}
        enableRowLinks={false}
        keywordMode="loaded"
      />
    );
  }
  return EpitopesView;
}
