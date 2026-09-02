import { StrainResourceCollection } from "@/components/views";
import { taxonLineageClause, type TaxonViewScope } from "./scope";

export function makeStrainsView({ scope }: { scope: TaxonViewScope }) {
  function StrainsView() {
    return (
      <StrainResourceCollection
        baseRql={taxonLineageClause(scope)}
        enableRowLinks={false}
        keywordMode="loaded"
      />
    );
  }
  return StrainsView;
}
