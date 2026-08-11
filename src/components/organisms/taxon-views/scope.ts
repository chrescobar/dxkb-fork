import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

export type TaxonViewScope =
  | { kind: "lineage"; taxon: OrganismTaxonomy }
  | {
      kind: "composite";
      displayName: string;
      roots: readonly OrganismTaxonomy[];
    };

export function taxonLineageClause(scope: TaxonViewScope): string {
  const roots = scopeRoots(scope);
  if (scope.kind === "lineage") {
    return `eq(taxon_lineage_ids,${String(scope.taxon.taxonId)})`;
  }

  return `or(${roots
    .map((root) => `eq(taxon_lineage_ids,${String(root.taxonId)})`)
    .join(",")})`;
}

export function scopeRoots(scope: TaxonViewScope): readonly OrganismTaxonomy[] {
  const roots = scope.kind === "lineage" ? [scope.taxon] : scope.roots;
  if (roots.length === 0) {
    throw new Error("Taxon view scopes must include at least one root taxon.");
  }
  return roots;
}
