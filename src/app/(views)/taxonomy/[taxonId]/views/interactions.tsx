import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import { InteractionsSubviewShell } from "@/components/interactions/interactions-subview-shell";

export function makeInteractionsView({ taxon }: { taxon: OrganismTaxonomy | null }) {
  function InteractionsView() {
    if (!taxon) return null;
    const q = `and(eq(genome_id_a,*),genome(to(genome_id_a),and(eq(taxon_lineage_ids,${String(taxon.taxonId)}),ne(genome_status,Deprecated))),eq(evidence,experimental))`;
    return (
      <InteractionsSubviewShell
        taxonId={taxon.taxonId}
        q={q}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/protein_protein_interactions.html"
      />
    );
  }
  return InteractionsView;
}
