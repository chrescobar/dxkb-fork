import { surveillanceFields } from "@/constants/datafields/surveillance";
import type { DataField } from "@/constants/datafields/types";
import { eq, validateRql } from "@/lib/data-api";
import {
  parseCollectionState,
  type CollectionState,
  type CollectionStateOptions,
} from "@/lib/views/collection-state";
import type { SearchParamsRecord } from "@/lib/views/rql";

const fields: DataField[] = Object.values(surveillanceFields);

export const surveillanceSorts = fields
  .filter((field) => field.show_in_table !== false && field.sortable !== false)
  .flatMap((field) => [`${field.field}:asc`, `${field.field}:desc`]);

const facetFields = fields
  .filter((field) => field.facet)
  .map((field) => field.field);

export const surveillanceCollectionOptions: CollectionStateOptions = {
  defaultSort: "unsorted",
  sortAllowlist: ["unsorted", ...surveillanceSorts],
  friendlyFilters: facetFields,
};

export function parseSurveillanceCollectionState(
  params: SearchParamsRecord,
): CollectionState {
  const state = parseCollectionState(params, surveillanceCollectionOptions);
  if (state.rql) state.rql = validateRql("surveillance", state.rql);
  return state;
}

export function surveillanceStructuralRql(
  state: CollectionState,
): string | undefined {
  if (state.rql) return undefined;
  const clauses = Object.entries(state.filters).flatMap(([field, selected]) => {
    const predicates = selected.map((value) =>
      eq("surveillance", field, value),
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
