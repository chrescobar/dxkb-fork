import { SerologyResourceCollection } from "@/components/views";
import { taxonLineageClause, type TaxonViewScope } from "./scope";

export function makeSerologyView({ scope }: { scope: TaxonViewScope }) {
  function SerologyView() {
    return (
      <SerologyResourceCollection
        baseRql={taxonLineageClause(scope)}
        enableRowLinks={false}
        keywordMode="loaded"
      />
    );
  }
  return SerologyView;
}
