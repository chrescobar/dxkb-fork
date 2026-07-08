import { TaxonomyTreePanel } from "@/components/taxonomy/taxonomy-tree-panel";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

export function makeTaxonomyTreeView({ taxon }: { taxon: OrganismTaxonomy | null }) {
  function TaxonomyTreeView() {
    if (!taxon) return null;
    return <TaxonomyTreePanel taxon={taxon} />;
  }
  return TaxonomyTreeView;
}
