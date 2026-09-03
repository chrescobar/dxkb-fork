import { proteinStructureFields } from "@/constants/datafields/protein_structure";
import type { DataField } from "@/constants/datafields/types";
import { eq, validateRql } from "@/lib/data-api";
import {
  parseCollectionState,
  type CollectionState,
  type CollectionStateOptions,
} from "@/lib/views/collection-state";
import type { SearchParamsRecord } from "@/lib/views/rql";

const unsafeProjectionFields = new Set(["sequence", "alignments"]);
const multipleFields = new Set([
  "organism_name",
  "taxon_lineage_ids",
  "taxon_lineage_names",
  "uniprotkb_accession",
  "institution",
  "authors",
]);
const fields: DataField[] = Object.values(proteinStructureFields);

export const proteinStructureSorts = fields
  .filter(
    (field) =>
      !unsafeProjectionFields.has(field.field) &&
      !multipleFields.has(field.field) &&
      field.show_in_table !== false &&
      field.sortable !== false,
  )
  .flatMap((field) => [`${field.field}:asc`, `${field.field}:desc`]);

const facetFields = fields
  .filter((field) => field.facet)
  .map((field) => field.field);

export const proteinStructureCollectionOptions: CollectionStateOptions = {
  defaultSort: "unsorted",
  sortAllowlist: ["unsorted", ...proteinStructureSorts],
  friendlyFilters: ["taxon_id", "genome_id", ...facetFields],
};

export function parseProteinStructureCollectionState(
  params: SearchParamsRecord,
): CollectionState {
  const state = parseCollectionState(params, proteinStructureCollectionOptions);
  if (state.rql) state.rql = validateRql("protein_structure", state.rql);
  return state;
}

export function proteinStructureStructuralRql(
  state: CollectionState,
): string | undefined {
  if (state.rql) return undefined;
  const clauses = Object.entries(state.filters).flatMap(([field, selected]) => {
    const backendField = field === "taxon_id" ? "taxon_lineage_ids" : field;
    const predicates = selected.map((value) =>
      eq("protein_structure", backendField, value),
    );
    return predicates.length === 0
      ? []
      : [
          predicates.length === 1
            ? predicates[0]
            : `or(${predicates.join(",")})`,
        ];
  });
  if (clauses.length === 0) return undefined;
  return clauses.length === 1 ? clauses[0] : `and(${clauses.join(",")})`;
}
