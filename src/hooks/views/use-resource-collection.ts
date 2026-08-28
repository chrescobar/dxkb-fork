"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { RowSelectionState, SortingState } from "@tanstack/react-table";
import type { CollectionState } from "@/lib/views/collection-state";
import type { DataRepository, DataResource, FacetBucket } from "@/lib/data-api";
import { resourceCollectionPageSize } from "./collection-state";
export type ResourceRow = Record<string, unknown>;
export type ResourceFacets = Record<string, FacetBucket[]>;

export interface UseResourceCollectionOptions {
  repository: DataRepository;
  resource: DataResource;
  idField: string;
  fields: readonly string[];
  detailFields?: readonly string[];
  facetFields?: readonly string[];
  structuralRql?: string;
  state: CollectionState;
  onStateChange: (state: CollectionState) => void;
}

const emptyFacets: ResourceFacets = {};

export function selectedIdsFromSelection(
  selection: RowSelectionState,
): string[] {
  return Object.keys(selection);
}

function combineRql(...parts: (string | undefined)[]) {
  const predicates = parts.filter((part): part is string => part !== undefined);
  if (predicates.length === 0) return undefined;
  if (predicates.length === 1) return predicates[0];
  return `and(${predicates.join(",")})`;
}

function dataSort(sort: string) {
  const [field, direction] = sort.split(":");
  return {
    field,
    direction: direction === "desc" ? ("desc" as const) : ("asc" as const),
  };
}

export function useResourceCollection<Row extends ResourceRow>({
  repository,
  resource,
  idField,
  fields,
  detailFields = fields,
  facetFields = [],
  structuralRql,
  state,
  onStateChange,
}: UseResourceCollectionOptions) {
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [isAllPagesSelected, setIsAllPagesSelected] = useState(false);
  const rql = combineRql(structuralRql, state.rql);
  const queryIdentity = JSON.stringify([
    resource,
    structuralRql,
    state.rql,
    state.keyword,
    state.filters,
  ]);
  const [previousQueryIdentity, setPreviousQueryIdentity] =
    useState(queryIdentity);
  if (previousQueryIdentity !== queryIdentity) {
    setPreviousQueryIdentity(queryIdentity);
    setSelection({});
    setIsAllPagesSelected(false);
  }
  const request = {
    rql,
    keyword: state.keyword,
    page: state.page,
    pageSize: resourceCollectionPageSize,
    sort: dataSort(state.sort),
    fields: [...fields],
    facets: [...facetFields],
  };

  const query = useQuery({
    queryKey: ["resource-collection", resource, request],
    queryFn: ({ signal }) =>
      repository.collection<Row>(resource, request, signal),
    placeholderData: keepPreviousData,
  });
  const rows = query.data?.rows;
  const visibleRows = rows ?? [];
  const selectedIds = selectedIdsFromSelection(selection);
  const activeId =
    !isAllPagesSelected && selectedIds.length === 1 ? selectedIds[0] : null;

  const detailQuery = useQuery({
    queryKey: ["resource-detail", resource, idField, activeId],
    queryFn: ({ signal }) =>
      repository.member<Row>(
        resource,
        { id: activeId ?? "", idField, fields: [...detailFields] },
        signal,
      ),
    enabled: activeId !== null,
  });
  const sorting: SortingState = [
    {
      id: dataSort(state.sort).field,
      desc: state.sort.endsWith(":desc"),
    },
  ];

  return {
    activeId,
    detail:
      detailQuery.data?.row ??
      visibleRows.find((row) => String(row[idField]) === activeId) ??
      null,
    detailError: detailQuery.error,
    facets: query.data?.facets ?? emptyFacets,
    isAllPagesSelected,
    isDetailLoading: detailQuery.isLoading,
    isInitialLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    error: query.error,
    refetch: query.refetch,
    rows: visibleRows,
    selection,
    selectedIds,
    sorting,
    total: query.data?.total ?? 0,
    setIsAllPagesSelected,
    setSelection,
    setPageIndex: (pageIndex: number) => {
      onStateChange({ ...state, page: pageIndex + 1 });
    },
    setSorting: (next: SortingState) => {
      const primary = next[0];
      onStateChange({
        ...state,
        page: 1,
        sort: `${primary.id}:${primary.desc ? "desc" : "asc"}`,
      });
    },
  };
}
