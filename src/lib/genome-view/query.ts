import { eq, validateRql } from "@/lib/data-api";
import {
  parseCollectionState,
  type CollectionState,
  type CollectionStateOptions,
} from "@/lib/views/collection-state";
import type { SearchParamsRecord } from "@/lib/views/rql";

import { genomeFields } from "@/constants/datafields/genome";
import type { DataField } from "@/constants/datafields/types";

export const genomeSorts = (Object.values(genomeFields) as DataField[])
  .filter((field) => field.show_in_table !== false && field.sortable !== false)
  .flatMap((field) => [`${field.field}:asc`, `${field.field}:desc`]);

export type GenomeSort = string;

export const recentGenomeRql =
  "and(gt(completion_date,NOW-1YEARS),ne(genome_status,Deprecated))";

export const genomeCollectionOptions: CollectionStateOptions = {
  defaultSort: "unsorted",
  sortAllowlist: ["unsorted", ...genomeSorts],
  friendlyFilters: [
    "taxon_id",
    "genome_status",
    "genome_quality",
    "collection_year",
    "isolation_country",
    "host_common_name",
  ],
  filterFieldMap: { taxon_id: "taxon_lineage_ids" },
};

export function parseGenomeCollectionState(
  params: SearchParamsRecord,
): CollectionState {
  const state = parseCollectionState(params, genomeCollectionOptions);
  if (state.rql) state.rql = validateRql("genome", state.rql);
  return state;
}

export function genomeStructuralRql(
  state: CollectionState,
): string | undefined {
  if (state.rql) return undefined;
  const fields: Record<string, string> = {
    taxon_id: "taxon_lineage_ids",
    genome_status: "genome_status",
    genome_quality: "genome_quality",
    collection_year: "collection_year",
    isolation_country: "isolation_country",
    host_common_name: "host_common_name",
  };
  const clauses = Object.entries(state.filters).flatMap(
    ([name, selectedValues]) => {
      const field = fields[name];
      if (!field) return [];
      const predicates = selectedValues.map((value) =>
        eq("genome", field, value),
      );
      return predicates.length === 1
        ? predicates
        : [`or(${predicates.join(",")})`];
    },
  );
  if (clauses.length === 0) return undefined;
  return clauses.length === 1 ? clauses[0] : `and(${clauses.join(",")})`;
}
