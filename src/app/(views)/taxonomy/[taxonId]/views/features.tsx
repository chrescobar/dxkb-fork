import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import { TaxonDataPanel } from "../_components/taxon-data-panel";

export function makeFeaturesView({ taxon }: { taxon: OrganismTaxonomy | null }) {
  function FeaturesView() {
    if (!taxon) return null;
    // annotation=PATRIC mirrors the legacy default view (excludes RefSeq
    // duplicate features so counts match legacy). genome_feature has no
    // taxon_lineage_ids field, so this cross-core joins to the genome core,
    // same shape as sequences.tsx.
    return (
      <TaxonDataPanel
        resource="genome_feature"
        q={`and(eq(genome_id,*),genome(and(eq(taxon_lineage_ids,${String(taxon.taxonId)}),ne(genome_status,Deprecated))),eq(annotation,PATRIC))`}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/features.html"
      />
    );
  }
  return FeaturesView;
}
