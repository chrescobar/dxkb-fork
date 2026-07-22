import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import { TaxonDataPanel } from "../_components/taxon-data-panel";

export function makeDomainsAndMotifsView({ taxon }: { taxon: OrganismTaxonomy | null }) {
  function DomainsAndMotifsView() {
    if (!taxon) return null;
    // protein_feature has no taxon_lineage_ids field, so this cross-core joins
    // to genome. Legacy proteinFeatures does not exclude Deprecated genomes.
    return (
      <TaxonDataPanel
        resource="protein_feature"
        q={`and(eq(genome_id,*),genome(eq(taxon_lineage_ids,${String(taxon.taxonId)})))`}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/domains_and_motifs.html"
      />
    );
  }
  return DomainsAndMotifsView;
}
