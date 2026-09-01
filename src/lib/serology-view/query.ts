import { serologyFields } from "@/constants/datafields/serology";
import type { DataField } from "@/constants/datafields/types";
import { eq, validateRql } from "@/lib/data-api";
import {
  parseCollectionState,
  type CollectionState,
  type CollectionStateOptions,
} from "@/lib/views/collection-state";
import type { SearchParamsRecord } from "@/lib/views/rql";

const fields: DataField[] = Object.values(serologyFields);

export const serologySorts = fields
  .filter((field) => field.show_in_table !== false && field.sortable !== false)
  .flatMap((field) => [`${field.field}:asc`, `${field.field}:desc`]);

const facetFields = fields
  .filter((field) => field.facet)
  .map((field) => field.field);

export const serologyCollectionOptions: CollectionStateOptions = {
  defaultSort: "unsorted",
  sortAllowlist: ["unsorted", ...serologySorts],
  friendlyFilters: facetFields,
};

export function parseSerologyCollectionState(
  params: SearchParamsRecord,
): CollectionState {
  const state = parseCollectionState(params, serologyCollectionOptions);
  if (state.rql) state.rql = validateRql("serology", state.rql);
  return state;
}

export function serologyStructuralRql(
  state: CollectionState,
): string | undefined {
  if (state.rql) return undefined;
  const clauses = Object.entries(state.filters).flatMap(([field, selected]) => {
    const predicates = selected.map((value) => eq("serology", field, value));
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
