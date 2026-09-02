import { strainFields } from "@/constants/datafields/strain";
import type { DataField } from "@/constants/datafields/types";
import { eq, validateRql } from "@/lib/data-api";
import {
  parseCollectionState,
  type CollectionState,
  type CollectionStateOptions,
} from "@/lib/views/collection-state";
import type { SearchParamsRecord } from "@/lib/views/rql";

const fields: DataField[] = Object.values(strainFields);
const multipleFields = new Set([
  "taxon_lineage_ids",
  "taxon_lineage_names",
  "genome_ids",
  "genbank_accessions",
  "1_pb2",
  "2_pb1",
  "3_pa",
  "4_ha",
  "5_np",
  "6_na",
  "7_mp",
  "8_ns",
  "s",
  "m",
  "l",
  "other_segments",
]);

export const strainSorts = fields
  .filter(
    (field) =>
      field.show_in_table !== false &&
      field.sortable !== false &&
      !multipleFields.has(field.field),
  )
  .flatMap((field) => [`${field.field}:asc`, `${field.field}:desc`]);

const facetFields = fields
  .filter((field) => field.facet)
  .map((field) => field.field);

export const strainCollectionOptions: CollectionStateOptions = {
  defaultSort: "unsorted",
  sortAllowlist: ["unsorted", ...strainSorts],
  friendlyFilters: ["taxon_id", "strain", ...facetFields],
};

export function parseStrainCollectionState(
  params: SearchParamsRecord,
): CollectionState {
  const state = parseCollectionState(params, strainCollectionOptions);
  if (state.rql) state.rql = validateRql("strain", state.rql);
  return state;
}

export function strainStructuralRql(
  state: CollectionState,
): string | undefined {
  if (state.rql) return undefined;
  const clauses = Object.entries(state.filters).flatMap(([field, selected]) => {
    const backendField = field === "taxon_id" ? "taxon_lineage_ids" : field;
    const predicates = selected.map((value) =>
      eq("strain", backendField, value),
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
