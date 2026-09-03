import { ProteinStructureResourceCollection } from "@/components/views";
import { taxonLineageClause, type TaxonViewScope } from "./scope";

export function makeProteinStructuresView({
  scope,
}: {
  scope: TaxonViewScope;
}) {
  function ProteinStructuresView() {
    return (
      <ProteinStructureResourceCollection
        baseRql={`and(eq(genome_id,*),genome(and(${taxonLineageClause(scope)},ne(genome_status,Deprecated))))`}
        enableFacets={false}
        enableRowLinks={false}
        keywordMode="loaded"
      />
    );
  }
  return ProteinStructuresView;
}
