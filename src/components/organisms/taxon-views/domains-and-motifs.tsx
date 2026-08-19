import { taxonLineageClause, type TaxonViewScope } from "./scope";
import { TaxonDataPanel } from "./taxon-data-panel";

export function makeDomainsAndMotifsView({ scope }: { scope: TaxonViewScope }) {
  function DomainsAndMotifsView() {
    // protein_feature has no taxon_lineage_ids field, so this cross-core joins
    // to genome. Legacy proteinFeatures does not exclude Deprecated genomes.
    return (
      <TaxonDataPanel
        resource="protein_feature"
        q={`and(eq(genome_id,*),genome(${taxonLineageClause(scope)}))`}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/domains_and_motifs.html"
      />
    );
  }
  return DomainsAndMotifsView;
}
