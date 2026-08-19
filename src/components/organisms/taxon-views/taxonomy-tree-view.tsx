import { TaxonomyTreePanel } from "@/components/taxonomy/taxonomy-tree-panel";
import { scopeRoots, type TaxonViewScope } from "./scope";

export function makeTaxonomyTreeView({ scope }: { scope: TaxonViewScope }) {
  function TaxonomyTreeView() {
    return <TaxonomyTreePanel taxa={scopeRoots(scope)} />;
  }
  return TaxonomyTreeView;
}
