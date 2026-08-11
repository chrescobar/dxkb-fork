import { InteractionsSubviewShell } from "@/components/interactions/interactions-subview-shell";

import { scopeRoots, taxonLineageClause, type TaxonViewScope } from "./scope";

export function makeInteractionsView({ scope }: { scope: TaxonViewScope }) {
  function InteractionsView() {
    const [root] = scopeRoots(scope);
    const q = `and(eq(genome_id_a,*),genome(to(genome_id_a),and(${taxonLineageClause(scope)},ne(genome_status,Deprecated))),eq(evidence,experimental))`;
    return (
      <InteractionsSubviewShell
        taxonId={root.taxonId}
        q={q}
        guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/interactions.html"
      />
    );
  }
  return InteractionsView;
}
