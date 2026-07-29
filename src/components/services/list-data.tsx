'use client';

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { SortingState, RowSelectionState } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { noop } from "@/lib/utils";
import { getIdField } from "@/constants/resources";
import { detailPanelQueryKey } from "@/components/genome/genome-detail-panel";
import { FilterBar } from "@/components/filterbar/filter-bar";
import type { DataFieldMap } from "@/constants/datafields/types";
import { genomeFields } from "@/constants/datafields/genome";
import { genomeAmrFields } from "@/constants/datafields/genome_amr";
import { genomeFeatureFields } from "@/constants/datafields/genome_feature";
import { genomeSequenceFields } from "@/constants/datafields/genome_sequence";
import { proteinFeatureFields } from "@/constants/datafields/protein_feature";
import { proteinStructureFields } from "@/constants/datafields/protein_structure";
import { sequenceFeatureFields } from "@/constants/datafields/sequence_feature";
import { strainFields } from "@/constants/datafields/strain";
import { surveillanceFields } from "@/constants/datafields/surveillance";
import { serologyFields } from "@/constants/datafields/serology";
import { taxonomyFields } from "@/constants/datafields/taxonomy";
import { biosetFields } from "@/constants/datafields/bioset";
import { epitopeFields } from "@/constants/datafields/epitope";
import { experimentFields } from "@/constants/datafields/experiment";
import { ppiFields } from "@/constants/datafields/ppi";

// Stable empty-rows reference so DataTable's memoized body comparator (prev.data === next.data)
// isn't defeated by a fresh [] on every render when there are no results.
const emptyRows: Record<string, unknown>[] = [];

interface ColumnInfo {
  id: string;
  label: string;
  visible: boolean;
  facet?: boolean;
  facet_hidden?: boolean;
}

// Static registry — mirrors the switch in info-panel.tsx. Imported statically
// (not dynamic import()) so `fields` is available on the very first render,
// which lets DataTable mount immediately with real column defs. That removes
// the pre-metadata loading phase entirely, so there is one skeleton (DataTable's
// own) and one width regime instead of three.
const resourceFields: Record<string, DataFieldMap | undefined> = {
  genome: genomeFields,
  genome_amr: genomeAmrFields,
  genome_feature: genomeFeatureFields,
  genome_sequence: genomeSequenceFields,
  protein_feature: proteinFeatureFields,
  protein_structure: proteinStructureFields,
  sequence_feature: sequenceFeatureFields,
  strain: strainFields,
  surveillance: surveillanceFields,
  serology: serologyFields,
  taxonomy: taxonomyFields,
  bioset: biosetFields,
  epitope: epitopeFields,
  experiment: experimentFields,
  ppi: ppiFields,
};

export function deriveTableFields(resource: string): ColumnInfo[] {
  const fieldObj = resourceFields[resource];
  if (!fieldObj) {
    console.error(`No fields definition found for resource: ${resource}`);
    return [];
  }
  return Object.values(fieldObj)
    .filter((f) => f.show_in_table !== false)
    .map((f) => ({
      id: f.field,
      label: f.label,
      visible: !f.hidden,
      facet: f.facet ?? false,
      facet_hidden: f.facet_hidden ?? true,
    }));
}


/**
 * Find a row in an already-fetched page by its ID field value.
 * Used to pre-populate the detail-panel query cache so row clicks render
 * instantly — the page fetch already has every field; no extra request needed.
 */
export function findPageRow(
  pageData: Record<string, unknown>[],
  idField: string,
  id: string,
): Record<string, unknown> | undefined {
  return pageData.find((r) => String(r[idField]) === id);
}

// The page query key is ['genome-full', resource, ...]; index 1 is the resource.
// Keeping previous rows across a resource change bleeds wrong-shaped data into a
// table keyed by the new resource's idField → duplicate/undefined React keys.
export function isSameResourceQuery(
  previousQueryKey: readonly unknown[] | undefined,
  resource: string,
): boolean {
  return previousQueryKey?.[1] === resource;
}

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

export function ListData({ q, resource, onSelectionChange, rowSelection: controlledRowSelection, onRowSelectionChange, pageIndex: controlledPageIndex, onPageChange, selectedIds, isAllPagesSelected: controlledIsAllPagesSelected, onAllPagesSelectionChange, onTotalItemsChange, filter: controlledFilter, onFilterChange, keywordValue, onKeywordChange }: ListDataProps) {
  const fields = useMemo(() => deriveTableFields(resource), [resource]);
  const queryClient = useQueryClient();
  const idField = getIdField(resource);

  // Use controlled rowSelection if provided, otherwise use internal state
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});
  const rowSelection = controlledRowSelection !== undefined ? controlledRowSelection : internalRowSelection;
  const setRowSelection = onRowSelectionChange || setInternalRowSelection;
  // `filter` is controlled only when the parent passes it. `onFilterChange`
  // alone is notify-only: ListData applies its filter locally and reports it.
  const [internalFilter, setInternalFilter] = useState('');
  const filter = controlledFilter !== undefined ? controlledFilter : internalFilter;
  const setFilter = useCallback((rql: string) => {
    if (controlledFilter === undefined) setInternalFilter(rql);
    onFilterChange?.(rql);
  }, [controlledFilter, onFilterChange]);
  const [internalIsAllPagesSelected, setInternalIsAllPagesSelected] = useState(false);
  const isAllPagesSelected = controlledIsAllPagesSelected !== undefined ? controlledIsAllPagesSelected : internalIsAllPagesSelected;
  const setIsAllPagesSelected = onAllPagesSelectionChange || setInternalIsAllPagesSelected;

  const facetFields = fields.filter(f => f.facet);

  const widget = {
    id: 'widget-1',
    columns: fields,
  };

  const searchParams = useSearchParams();
  const searchtype = searchParams.get('type') ?? '';
  const cleanQ = q.split('#')[0];
  const DataAPI = process.env.NEXT_PUBLIC_DATA_API;
  if (!DataAPI) {
    throw new Error('NEXT_PUBLIC_DATA_API environment variable is not configured');
  }
  const pageSize = 200;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    fields.length ? ['__select__', ...fields.map(f => f.id)] : []
  );
  const [internalPageIndex, setInternalPageIndex] = useState(0);
  const pageIndex = controlledPageIndex !== undefined ? controlledPageIndex : internalPageIndex;
  const setPageIndex = onPageChange || setInternalPageIndex;

  const [prevResource, setPrevResource] = useState(resource);
  if (prevResource !== resource) {
    setPrevResource(resource);
    setSorting([]);
  }

  const setSortingAndResetPage = useCallback((newSorting: SortingState) => {
    setSorting(newSorting);
    setPageIndex(0);
//    setRowSelection({});
//    onSelectionChange?.([]); // Clear selection in parent too
  }, [setPageIndex]);

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const vis: Record<string, boolean> = { __select__: true };
    fields.forEach(f => { vis[f.id] = f.visible; });
    return vis;
  });

  // Reseed order + visibility if `fields` identity changes (resource swap on the
  // same ListData instance). With synchronous field derivation this does not fire
  // on mount — only on an actual resource change.
  const [prevFields, setPrevFields] = useState(fields);
  if (prevFields !== fields) {
    setPrevFields(fields);
    if (fields.length) {
      setColumnOrder(['__select__', ...fields.map(f => f.id)]);
      const vis: Record<string, boolean> = { __select__: true };
      fields.forEach(f => { vis[f.id] = f.visible; });
      setColumnVisibility(vis);
    }
  }

  // Compute sortingKey from state using useMemo
  const sortingKey = useMemo(() => {
    return sorting.length > 0
      ? `${sorting[0].id}:${sorting[0].desc ? 'desc' : 'asc'}`
      : 'none';
  }, [sorting]);

  const combinedQuery = useMemo(() => {
    if (!filter || filter === 'false') return cleanQ;
    if (!cleanQ) return filter;

    return `and(${cleanQ},${filter})`;
  }, [cleanQ, filter]);

  interface MetaResponse { response?: { numFound?: number } }

  // Fetch metadata (numFound)
  const { data: metaData, isLoading: metaLoading, error: metaError } = useQuery<MetaResponse>({
    queryKey: ['genome-meta', resource, combinedQuery, searchtype],
    queryFn: async () => {
      const baseURL = `${DataAPI}/${resource}/?${combinedQuery}`;
      const res = await fetch(`${baseURL}&limit(1)`, {
        headers: { 'Accept': 'application/solr+json' }
      });
      if (!res.ok) throw new Error(`Failed to fetch metadata (${String(res.status)} ${res.statusText})`);
      return res.json() as Promise<MetaResponse>;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Compute totalItems safely
  const totalItems = metaData?.response?.numFound ?? 0;

  // Notify parent when totalItems changes
  useEffect(() => {
    if (onTotalItemsChange) {
      onTotalItemsChange(totalItems);
    }
  }, [totalItems, onTotalItemsChange]);

  // Fetch current page of data
  const { data: pageData, isLoading: dataLoading, isPlaceholderData, error: dataError } = useQuery<Record<string, unknown>[]>({
    queryKey: [
      'genome-full',
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
      const sortClause = sortingKey !== "none"
        ? (() => { const [field, dir] = sortingKey.split(":"); return `&sort(${dir === "desc" ? "-" : "+"}${field})`; })()
        : "";
      const fieldMap = resourceFields[resource];
      const selectIds = fieldMap
        ? [...new Set([idField, ...Object.values(fieldMap).map(f => f.field)])]
        : [idField];
      const selectClause = `&select(${selectIds.join(',')})`;
      const url = `${baseURL}${sortClause}${selectClause}`;

      const res = await fetch(url, {
        headers: {
          'Content-type': 'application/rqlquery+x-www-form-urlencoded',
          'Accept': 'application/json',
          'Range': `items=${String(start)}-${String(end)}`,
          'X-Range': `items=${String(start)}-${String(end)}`,
        }
      });
      if (!res.ok) throw new Error(`Failed to fetch genome data (${String(res.status)} ${res.statusText})`);
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
      isSameResourceQuery(previousQuery?.queryKey, resource) ? previousData : undefined,
    staleTime: 5 * 60 * 1000,
  });

  // Prefetch adjacent pages so navigation is instant once the current page is cached.
  useEffect(() => {
    if (!totalItems) return;
    const fieldMap = resourceFields[resource];
    const selectIds = fieldMap
      ? [...new Set([idField, ...Object.values(fieldMap).map(f => f.field)])]
      : [idField];
    const sortClause = sortingKey !== "none"
      ? (() => { const [field, dir] = sortingKey.split(":"); return `&sort(${dir === "desc" ? "-" : "+"}${field})`; })()
      : "";
    const prefetchURL = `${DataAPI}/${resource}/?${combinedQuery}${sortClause}&select(${selectIds.join(',')})`;

    const prefetch = (idx: number) => {
      if (idx < 0 || idx * pageSize >= totalItems) return;
      const start = idx * pageSize;
      const end = start + pageSize;
      void queryClient.prefetchQuery({
        queryKey: ['genome-full', resource, combinedQuery, idx, sortingKey, searchtype, totalItems],
        queryFn: async () => {
          const res = await fetch(prefetchURL, {
            headers: {
              'Content-type': 'application/rqlquery+x-www-form-urlencoded',
              'Accept': 'application/json',
              'Range': `items=${String(start)}-${String(end)}`,
              'X-Range': `items=${String(start)}-${String(end)}`,
            }
          });
          if (!res.ok) throw new Error(`Failed to fetch genome data (${String(res.status)} ${res.statusText})`);
          return res.json() as Promise<Record<string, unknown>[]>;
        },
        staleTime: 5 * 60 * 1000,
      });
    };
    prefetch(pageIndex + 1);
    prefetch(pageIndex - 1);
  }, [pageIndex, totalItems, combinedQuery, sortingKey, searchtype, resource, queryClient, idField, DataAPI, pageSize]);

  const errorMessage = metaError ?? dataError
    ? `Error: ${((metaError ?? dataError)?.message ?? 'Unknown error')} — Query: ${JSON.stringify(q)}`
    : undefined;

  const handleRowSelectionChange = (newSelection: Record<string, boolean>) => {
    // Apply new selection from table. Avoiding aggressive ignores here so
    // header "select all" and explicit deselect actions work reliably.
    setRowSelection(newSelection);

    // Clear all pages selection when individual rows change
    if (isAllPagesSelected) {
      setIsAllPagesSelected(false);
    }

    const selectedIds = Object.keys(newSelection)
      .filter((id) => newSelection[id]);

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

  async function handleDownloadAll(format: 'csv' | 'txt', visibleColumns: string[] | null): Promise<void> {
    if (!totalItems) {
      console.warn('No totalItems available for download');
      return;
    }
    
    // Check if totalItems exceeds the download limit
    const DOWNLOAD_LIMIT = 50000;
    if (totalItems > DOWNLOAD_LIMIT) {
      alert(`The download limit is ${DOWNLOAD_LIMIT.toLocaleString()} rows. Your query returned ${String(totalItems)} rows. Please refine your search to download fewer results.`);
      return;
    }
    
    try {
      const baseURL = `${DataAPI ?? ""}/${resource}/?${combinedQuery}`;
      const res = await fetch(baseURL, {
        headers: {
          'Content-type': 'application/rqlquery+x-www-form-urlencoded',
          'Accept': 'application/json',
          'Range': `items=0-${String(totalItems)}`,
          'X-Range': `items=0-${String(totalItems)}`,
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch all data: ${String(res.status)} ${res.statusText}`);
      const allData = await (res.json() as Promise<unknown>);

      const allDataObj = allData as Record<string, unknown>;
      const rowsArray: unknown[] = Array.isArray(allData) ? allData : ((allDataObj.items ?? allDataObj.response ?? allDataObj.rows ?? []) as unknown[]);
      const colsToExport = (visibleColumns && visibleColumns.length > 0)
        ? visibleColumns
        : fields.map((c) => c.id);

      const headers = colsToExport.map((id) => {
        const col = fields.find((c) => c.id === id);
        return col?.label ?? id;
      });

      const separator = format === 'csv' ? ',' : '\t';

      const escapeValue = (val: unknown) => {
        if (val === undefined || val === null) return '';
        if (typeof val === 'string') {
          const cleaned = val.replace(/\r\n|\n|\r/g, ' ');
          return `"${cleaned.replace(/"/g, '""')}"`;
        }
        if (typeof val === 'object') {
          const s = JSON.stringify(val);
          const cleaned = s.replace(/\r\n|\n|\r/g, ' ');
          return `"${cleaned.replace(/"/g, '""')}"`;
        }
        if (typeof val === 'symbol') return val.description ?? val.toString();
        if (typeof val === 'number' || typeof val === 'bigint' || typeof val === 'boolean') return String(val);
        return '';
      };

      const contentRows = rowsArray.map((row: unknown) => {
        const r = row as Record<string, unknown>;
        return colsToExport
          .map((colId) => {
            const val = r[colId];
            if (format === 'csv') return escapeValue(val);
            if (val === undefined || val === null) return '';
            if (typeof val === 'object') return JSON.stringify(val).replace(/\r\n|\n|\r/g, ' ');
            if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'bigint' || typeof val === 'string') return String(val).replace(/\r\n|\n|\r/g, ' ');
            return '';
          })
          .join(separator);
      });

      const content = [headers.join(separator), ...contentRows].join('\n');

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${resource}-all.${format}`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Download all failed:', err);
      alert('Failed to download all results. See console for details.');
      throw err; // Re-throw to allow the DataTable to handle the error
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <FilterBar
        facetFields={facetFields}
        resource={resource}
        query={cleanQ}
        keywordValue={keywordValue}
        onKeywordChange={onKeywordChange}
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