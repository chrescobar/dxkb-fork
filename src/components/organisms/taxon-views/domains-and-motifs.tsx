import { ProteinFeatureResourceCollection } from "@/components/views";
import { taxonLineageClause, type TaxonViewScope } from "./scope";

export function makeDomainsAndMotifsView({ scope }: { scope: TaxonViewScope }) {
  function DomainsAndMotifsView() {
    // protein_feature has no taxon_lineage_ids field, so this cross-core joins
    // to genome. Legacy proteinFeatures does not exclude Deprecated genomes.
    return (
      <ProteinFeatureResourceCollection
        baseRql={`and(eq(genome_id,*),genome(${taxonLineageClause(scope)}))`}
        enableRowLinks={false}
        keywordMode="loaded"
      />
    );
  }
  return DomainsAndMotifsView;
}
