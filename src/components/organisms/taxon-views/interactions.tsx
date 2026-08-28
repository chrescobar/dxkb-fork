import { InteractionsSubviewShell } from "@/components/interactions/interactions-subview-shell";

import { taxonomyInteractionsRql } from "@/lib/views/child-resources";
import { scopeRoots, taxonLineageClause, type TaxonViewScope } from "./scope";

export function makeInteractionsView({ scope }: { scope: TaxonViewScope }) {
  function InteractionsView() {
    const [root] = scopeRoots(scope);
    const q = taxonomyInteractionsRql(taxonLineageClause(scope));
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
