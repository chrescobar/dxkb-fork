import { SurveillanceResourceCollection } from "@/components/views";
import { taxonLineageClause, type TaxonViewScope } from "./scope";

export function makeSurveillanceView({ scope }: { scope: TaxonViewScope }) {
  function SurveillanceView() {
    return (
      <SurveillanceResourceCollection
        baseRql={taxonLineageClause(scope)}
        enableRowLinks={false}
        keywordMode="loaded"
      />
    );
  }
  return SurveillanceView;
}
