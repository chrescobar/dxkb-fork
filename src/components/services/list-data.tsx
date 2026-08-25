"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { SortingState, RowSelectionState } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { noop } from "@/lib/utils";
import { getIdField } from "@/constants/resources";
import { detailPanelQueryKey } from "@/components/genome/genome-detail-panel-utils";
import { FilterBar } from "@/components/filterbar/filter-bar";
import {
  deriveTableFields,
  downloadResourceRows,
  findPageRow,
  isSameResourceQuery,
  resourceFields,
} from "./list-data-utils";

// Stable empty-rows reference so DataTable's memoized body comparator (prev.data === next.data)
// isn't defeated by a fresh [] on every render when there are no results.
const emptyRows: Record<string, unknown>[] = [];

interface ListDataProps {
  q: string;
  resource: string; // 'genome', 'gene', etc.
  onSelectionChange?: (ids: string[]) => void;
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;
  pageIndex?: number;
  onPageChange?: (page: number) => void;
  selectedIds?: string[];
  isAllPagesSelected?: boolean;
  onAllPagesSelectionChange?: (selected: boolean) => void;
  onTotalItemsChange?: (total: number) => void;
  filter?: string;
  onFilterChange?: (rql: string) => void;
  keywordValue?: string;
  onKeywordChange?: (value: string) => void;
}

function useListData({
  q,
  resource,
  onSelectionChange,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  pageIndex: controlledPageIndex,
  onPageChange,
  selectedIds,
  isAllPagesSelected: controlledIsAllPagesSelected,
  onAllPagesSelectionChange,
  onTotalItemsChange,
  filter: controlledFilter,
  onFilterChange,
  keywordValue,
  onKeywordChange,
}: ListDataProps) {
  const fields = deriveTableFields(resource);
  const queryClient = useQueryClient();
  const idField = getIdField(resource);

  // Use controlled rowSelection if provided, otherwise use internal state
  const [internalRowSelection, setInternalRowSelection] =
    useState<RowSelectionState>({});
  const rowSelection =
    controlledRowSelection !== undefined
      ? controlledRowSelection
      : internalRowSelection;
  const setRowSelection = onRowSelectionChange || setInternalRowSelection;
  // `filter` is controlled only when the parent passes it. `onFilterChange`
  // alone is notify-only: ListData applies its filter locally and reports it.
  const [internalFilter, setInternalFilter] = useState("");
  const filter =
    controlledFilter !== undefined ? controlledFilter : internalFilter;
  const setFilter = (rql: string) => {
    if (controlledFilter === undefined) setInternalFilter(rql);
    onFilterChange?.(rql);
  };
  const [internalIsAllPagesSelected, setInternalIsAllPagesSelected] =
    useState(false);
  const isAllPagesSelected =
    controlledIsAllPagesSelected !== undefined
      ? controlledIsAllPagesSelected
      : internalIsAllPagesSelected;
  const setIsAllPagesSelected =
    onAllPagesSelectionChange || setInternalIsAllPagesSelected;

  const facetFields = fields.filter((f) => f.facet);

  const widget = {
    id: "widget-1",
    columns: fields,
  };

  const searchParams = useSearchParams();
  const searchtype = searchParams.get("type") ?? "";
  const cleanQ = q.split("#")[0];
  const DataAPI = process.env.NEXT_PUBLIC_DATA_API;
  if (!DataAPI) {
    throw new Error(
      "NEXT_PUBLIC_DATA_API environment variable is not configured",
    );
  }
  const pageSize = 200;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    fields.length ? ["__select__", ...fields.map((f) => f.id)] : [],
  );
  const [internalPageIndex, setInternalPageIndex] = useState(0);
  const pageIndex =
    controlledPageIndex !== undefined ? controlledPageIndex : internalPageIndex;
  const setPageIndex = onPageChange || setInternalPageIndex;

  const [prevResource, setPrevResource] = useState(resource);
  if (prevResource !== resource) {
    setPrevResource(resource);
    setSorting([]);
  }

  const setSortingAndResetPage = (newSorting: SortingState) => {
    setSorting(newSorting);
    setPageIndex(0);
  };

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(() => {
    const vis: Record<string, boolean> = { __select__: true };
    fields.forEach((f) => {
      vis[f.id] = f.visible;
    });
    return vis;
  });

  // Reseed order + visibility if `fields` identity changes (resource swap on the
  // same ListData instance). With synchronous field derivation this does not fire
  // on mount — only on an actual resource change.
  const [prevFields, setPrevFields] = useState(fields);
  if (prevFields !== fields) {
    setPrevFields(fields);
    if (fields.length) {
      setColumnOrder(["__select__", ...fields.map((f) => f.id)]);
      const vis: Record<string, boolean> = { __select__: true };
      fields.forEach((f) => {
        vis[f.id] = f.visible;
      });
      setColumnVisibility(vis);
    }
  }

  const sortingKey =
    sorting.length > 0
      ? `${sorting[0].id}:${sorting[0].desc ? "desc" : "asc"}`
      : "none";

  const combinedQuery =
    !filter || filter === "false"
      ? cleanQ
      : !cleanQ
        ? filter
        : `and(${cleanQ},${filter})`;

  interface MetaResponse {
    response?: { numFound?: number };
  }

  // Fetch metadata (numFound)
  const {
    data: metaData,
    isLoading: metaLoading,
    error: metaError,
  } = useQuery<MetaResponse>({
    queryKey: ["genome-meta", resource, combinedQuery, searchtype],
    queryFn: async () => {
      const baseURL = `${DataAPI}/${resource}/?${combinedQuery}`;
      const res = await fetch(`${baseURL}&limit(1)`, {
        headers: { Accept: "application/solr+json" },
      });
      if (!res.ok)
        throw new Error(
          `Failed to fetch metadata (${String(res.status)} ${res.statusText})`,
        );
      return res.json() as Promise<MetaResponse>;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Compute totalItems safely
  const totalItems = metaData?.response?.numFound ?? 0;

  const notifyTotalItems = (node: HTMLSpanElement | null) => {
    if (node) onTotalItemsChange?.(totalItems);
  };

  // Fetch current page of data
  const {
    data: pageData,
    isLoading: dataLoading,
    isPlaceholderData,
    error: dataError,
  } = useQuery<Record<string, unknown>[]>({
    queryKey: [
      "genome-full",
      resource,
      combinedQuery,
      pageIndex,
      sortingKey,
      searchtype,
      totalItems,
    ],
    queryFn: async () => {
      if (totalItems === 0) return [];

      // Derive sort param from sortingKey (already in queryKey) to avoid stale closure
      const start = pageIndex * pageSize;
      const end = start + pageSize;

      const baseURL = `${DataAPI}/${resource}/?${combinedQuery}`;
      const sortClause =
        sortingKey !== "none"
          ? (() => {
              const [field, dir] = sortingKey.split(":");
              return `&sort(${dir === "desc" ? "-" : "+"}${field})`;
            })()
          : "";
      const fieldMap = resourceFields[resource];
      const selectIds = fieldMap
        ? [
            ...new Set([
              idField,
              ...Object.values(fieldMap).map((f) => f.field),
            ]),
          ]
        : [idField];
      const selectClause = `&select(${selectIds.join(",")})`;
      const url = `${baseURL}${sortClause}${selectClause}`;

      const res = await fetch(url, {
        headers: {
          "Content-type": "application/rqlquery+x-www-form-urlencoded",
          Accept: "application/json",
          Range: `items=${String(start)}-${String(end)}`,
          "X-Range": `items=${String(start)}-${String(end)}`,
        },
      });
      if (!res.ok)
        throw new Error(
          `Failed to fetch genome data (${String(res.status)} ${res.statusText})`,
        );
      return res.json() as Promise<Record<string, unknown>[]>;
    },
    enabled: totalItems > 0,
    // Keep previous page's rows during refetch for smooth pagination — but ONLY
    // within the same resource. On a tab switch (e.g. genome → strain) the query
    // key's resource changes; bleeding the old resource's rows into a table now
    // keyed by the new resource's idField produces duplicate/undefined React keys
    // (genome rows share a `strain`, or lack it entirely). Drop the placeholder
    // when the resource differs so the table renders empty until real rows land.
    placeholderData: (previousData, previousQuery) =>
      isSameResourceQuery(previousQuery?.queryKey, resource)
        ? previousData
        : undefined,
    staleTime: 5 * 60 * 1000,
  });

  // Prefetch adjacent pages so navigation is instant once the current page is cached.
  useEffect(() => {
    if (!totalItems) return;
    const fieldMap = resourceFields[resource];
    const selectIds = fieldMap
      ? [...new Set([idField, ...Object.values(fieldMap).map((f) => f.field)])]
      : [idField];
    const sortClause =
      sortingKey !== "none"
        ? (() => {
            const [field, dir] = sortingKey.split(":");
            return `&sort(${dir === "desc" ? "-" : "+"}${field})`;
          })()
        : "";
    const prefetchURL = `${DataAPI}/${resource}/?${combinedQuery}${sortClause}&select(${selectIds.join(",")})`;

    const prefetch = (idx: number) => {
      if (idx < 0 || idx * pageSize >= totalItems) return;
      const start = idx * pageSize;
      const end = start + pageSize;
      void queryClient
        .query({
          queryKey: [
            "genome-full",
            resource,
            combinedQuery,
            idx,
            sortingKey,
            searchtype,
            totalItems,
          ],
          queryFn: async () => {
            const res = await fetch(prefetchURL, {
              headers: {
                "Content-type": "application/rqlquery+x-www-form-urlencoded",
                Accept: "application/json",
                Range: `items=${String(start)}-${String(end)}`,
                "X-Range": `items=${String(start)}-${String(end)}`,
              },
            });
            if (!res.ok)
              throw new Error(
                `Failed to fetch genome data (${String(res.status)} ${res.statusText})`,
              );
            return res.json() as Promise<Record<string, unknown>[]>;
          },
          staleTime: 5 * 60 * 1000,
        })
        .catch(noop);
    };
    prefetch(pageIndex + 1);
    prefetch(pageIndex - 1);
  }, [
    pageIndex,
    totalItems,
    combinedQuery,
    sortingKey,
    searchtype,
    resource,
    queryClient,
    idField,
    DataAPI,
    pageSize,
  ]);

  const errorMessage =
    (metaError ?? dataError)
      ? `Error: ${(metaError ?? dataError)?.message ?? "Unknown error"} — Query: ${JSON.stringify(q)}`
      : undefined;

  const handleRowSelectionChange = (newSelection: Record<string, boolean>) => {
    // Apply new selection from table. Avoiding aggressive ignores here so
    // header "select all" and explicit deselect actions work reliably.
    setRowSelection(newSelection);

    // Clear all pages selection when individual rows change
    if (isAllPagesSelected) {
      setIsAllPagesSelected(false);
    }

    const selectedIds = Object.keys(newSelection).filter(
      (id) => newSelection[id],
    );

    // Pre-populate the detail panel's query cache from already-fetched page data so
    // GenomeDetailPanel renders instantly (no loading flash) without an extra fetch.
    if (selectedIds.length === 1 && pageData) {
      const id = selectedIds[0];
      const row = findPageRow(pageData, idField, id);
      if (row) queryClient.setQueryData(detailPanelQueryKey(resource, id), row);
    }

    onSelectionChange?.(selectedIds);
  };

  const handleAllPagesSelectionChange = (selected: boolean) => {
    setIsAllPagesSelected(selected);
    onAllPagesSelectionChange?.(selected);

    if (selected) {
      // When selecting all pages, notify parent with all item IDs
      // For now, we'll just set the flag - actual implementation would need to fetch all IDs
    } else {
      // When deselecting all pages, clear selection
      setRowSelection({});
      onSelectionChange?.([]);
    }
  };

  const handlePageChange = (newPage: number) => {
    // Update page index (this will call parent's setPageIndex if controlled)
    setPageIndex(newPage);
  };

  async function handleDownloadAll(
    format: "csv" | "txt",
    visibleColumns: string[] | null,
  ): Promise<void> {
    if (!totalItems) {
      console.warn("No totalItems available for download");
      return;
    }

    // Check if totalItems exceeds the download limit
    const DOWNLOAD_LIMIT = 50000;
    if (totalItems > DOWNLOAD_LIMIT) {
      alert(
        `The download limit is ${DOWNLOAD_LIMIT.toLocaleString()} rows. Your query returned ${String(totalItems)} rows. Please refine your search to download fewer results.`,
      );
      return;
    }

    try {
      await downloadResourceRows({
        dataApi: DataAPI ?? "",
        resource,
        query: combinedQuery,
        totalItems,
        format,
        visibleColumns,
        fields,
      });
    } catch (error) {
      console.error("Download all failed:", error);
      alert("Failed to download all results. See console for details.");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <span ref={notifyTotalItems} hidden />
      <FilterBar
        facetFields={facetFields}
        resource={resource}
        query={cleanQ}
        keywordValue={keywordValue}
        onKeywordChange={onKeywordChange}
        keywordPlaceholder={
          resource === "ppi" ? "Search interaction results..." : undefined
        }
        onFilterChange={(rql) => {
          setFilter(rql);
          setPageIndex(0);
          setRowSelection({});
          onSelectionChange?.([]);
          setIsAllPagesSelected(false);
        }}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DataTable
          id={widget.id}
          data={totalItems === 0 ? emptyRows : (pageData ?? emptyRows)}
          columns={widget.columns}
          resource={resource}
          errorMessage={errorMessage}
          rowSelection={rowSelection}
          onRowSelectionChange={handleRowSelectionChange}
          onSelectionChange={noop}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          sorting={sorting}
          onSortingChange={setSortingAndResetPage}
          columnOrder={columnOrder}
          onColumnOrderChange={setColumnOrder}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          isAllPagesSelected={isAllPagesSelected}
          onAllPagesSelectionChange={handleAllPagesSelectionChange}
          onDownloadAll={handleDownloadAll}
          isLoading={metaLoading || dataLoading || isPlaceholderData}
          selectedIds={selectedIds ?? []}
        />
      </div>
    </div>
  );
}

export function ListData(props: ListDataProps) {
  return useListData(props);
}
