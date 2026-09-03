import { ExperimentResourceCollection } from "@/components/views";
import { taxonLineageClause, type TaxonViewScope } from "./scope";

export function makeExperimentsView({ scope }: { scope: TaxonViewScope }) {
  function ExperimentsView() {
    return (
      <ExperimentResourceCollection
        baseRql={taxonLineageClause(scope)}
        enableRowLinks={false}
        keywordMode="loaded"
      />
    );
  }
  return ExperimentsView;
}
