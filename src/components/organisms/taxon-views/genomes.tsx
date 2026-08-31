import { GenomeResourceCollection } from "@/components/views";
import { taxonLineageClause, type TaxonViewScope } from "./scope";

export function makeGenomesView({ scope }: { scope: TaxonViewScope }) {
  function GenomesView() {
    return (
      <GenomeResourceCollection
        baseRql={taxonLineageClause(scope)}
        enableRowLinks={false}
        keywordMode="loaded"
      />
    );
  }
  return GenomesView;
}
