"use client";

import {
  Component,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useKeyHold } from "@tanstack/react-hotkeys";
import {
  type ExpandedState,
  type Row,
  type RowSelectionState,
  type Updater,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

import {
  fetchTaxonChildren,
  taxonChildrenKey,
  useTaxonChildCounts,
} from "./use-taxon-children";
import { isLeaf, type TaxonRecord } from "./taxon-tree-types";
import {
  isPlaceholder,
  numericId,
  taxonomyColumns,
  type TreeTableMeta,
} from "./taxonomy-tree-columns";
import { taxonomyRowHeight, TreeTableView } from "./taxonomy-tree-view";

const maxOpenParam = 20;

interface TaxonomyTreeProps {
  rootTaxa: readonly OrganismTaxonomy[];
  onSelect?: (rows: TaxonRecord[]) => void;
}

interface SelectionState {
  selected: RowSelectionState;
  records: Map<string, TaxonRecord>;
}

function rootToRecord(taxon: OrganismTaxonomy): TaxonRecord {
  return {
    taxon_id: taxon.taxonId,
    taxon_name: taxon.taxonName,
    taxon_rank: taxon.taxonRank,
    genomes: taxon.genomes ?? undefined,
    lineage_names: taxon.lineageNames,
  };
}

function rootSignature(rootTaxa: readonly OrganismTaxonomy[]): string {
  let signature = "";
  for (const taxon of rootTaxa) {
    signature += `${String(taxon.taxonId)}:${taxon.taxonName}:${taxon.taxonRank}:${String(
      taxon.genomes ?? "",
    )}:${JSON.stringify(taxon.lineageNames)}|`;
  }
  return signature;
}

function initialExpansion(
  rootIds: number[],
  open: string | null,
): ExpandedState {
  const initial: Record<string, boolean> = {};
  for (const rootId of rootIds) initial[String(rootId)] = true;
  if (open) {
    for (const id of open.split(",").slice(0, maxOpenParam)) {
      const parsed = Number(id);
      if (Number.isInteger(parsed) && parsed > 0)
        initial[String(parsed)] = true;
    }
  }
  return initial;
}

function resolveUpdater<T>(updater: Updater<T>, current: T): T {
  return typeof updater === "function"
    ? (updater as (value: T) => T)(current)
    : updater;
}

function usePersistedExpansion(
  expandedIds: number[],
  rootIds: number[],
  globalFilter: string,
) {
  const pathname = usePathname();
  const lastOpenParamRef = useRef<string | null>(null);
  const rootIdSet = new Set(rootIds);
  const openIds: number[] = [];
  for (const id of expandedIds) {
    if (!rootIdSet.has(id)) openIds.push(id);
  }
  const openParam = openIds
    .sort((a, b) => a - b)
    .slice(0, maxOpenParam)
    .join(",");

  useEffect(() => {
    if (globalFilter || lastOpenParamRef.current === openParam) return;
    lastOpenParamRef.current = openParam;
    const params = new URLSearchParams(window.location.search);
    if (openParam) params.set("open", openParam);
    else params.delete("open");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      query ? `${pathname}?${query}` : pathname,
    );
  }, [globalFilter, openParam, pathname]);
}

interface TreeInstanceProps {
  rootRecords: TaxonRecord[];
  rootIds: number[];
  open: string | null;
  onSelect?: (rows: TaxonRecord[]) => void;
}

function TaxonomyTreeInstance({
  rootRecords,
  rootIds,
  open,
  onSelect,
}: TreeInstanceProps) {
  "use no memo";

  const [expanded, setExpanded] = useState<ExpandedState>(() =>
    initialExpansion(rootIds, open),
  );
  const [globalFilter, setGlobalFilter] = useState("");
  const [selection, setSelection] = useState<SelectionState>(() => ({
    selected: {},
    records: new Map(),
  }));
  const knownChildCountsRef = useRef<Map<number, number>>(new Map());
  const lastSelectedIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchParentIds: number[] = [];
  if (expanded === true) {
    fetchParentIds.push(...rootIds);
  } else {
    for (const id in expanded) {
      if (!expanded[id]) continue;
      const parsed = Number(id);
      if (Number.isFinite(parsed)) fetchParentIds.push(parsed);
    }
  }

  const queryState = useQueries({
    queries: fetchParentIds.map((parentId) => ({
      queryKey: taxonChildrenKey(parentId),
      queryFn: () => fetchTaxonChildren(parentId),
    })),
    combine: (results) => {
      const children = new Map<number, TaxonRecord[]>();
      const loading = new Set<number>();
      for (let index = 0; index < results.length; index++) {
        const parentId = fetchParentIds[index];
        const query = results[index];
        if (query.isPending) {
          loading.add(parentId);
        } else if (query.isError) {
          children.set(parentId, [
            {
              taxon_id: `__ph_error_${String(parentId)}`,
              taxon_name: "",
              taxon_rank: "",
              __state: "error",
              __message: query.error.message,
            },
          ]);
        } else {
          children.set(parentId, query.data);
        }
      }
      let queryVersion = "";
      for (const result of results) {
        queryVersion += `${result.status}:${String(result.dataUpdatedAt)}|`;
      }
      // React Query structurally shares combine results. The version field changes only
      // when a child query settles, invalidating TanStack Table's identity-keyed model.
      const data = rootRecords.map((record) => ({
        ...record,
        __queryVersion: queryVersion,
      }));
      return { children, loading, data };
    },
  });

  const shiftHeld = useKeyHold("Shift");
  const ctrlHeld = useKeyHold("Control");
  const metaHeld = useKeyHold("Meta");
  const ctrlOrCmdHeld = ctrlHeld || metaHeld;

  let tableRows: Row<TaxonRecord>[] = [];
  function commitSelection(nextSelected: RowSelectionState) {
    const records = new Map(selection.records);
    for (const row of tableRows) {
      if (nextSelected[row.id] && !isPlaceholder(row.original)) {
        records.set(row.id, row.original);
      }
    }
    for (const id of records.keys()) {
      if (!nextSelected[id]) records.delete(id);
    }
    setSelection({ selected: nextSelected, records });
    onSelect?.([...records.values()]);
  }

  function handleSelectionChange(updater: Updater<RowSelectionState>) {
    commitSelection(resolveUpdater(updater, selection.selected));
  }

  function applyShiftRange(row: Row<TaxonRecord>, merge: boolean): boolean {
    const anchorId = lastSelectedIdRef.current;
    if (!shiftHeld || !anchorId) return false;
    const anchorIndex = tableRows.findIndex(
      (candidate) => candidate.id === anchorId,
    );
    const clickedIndex = tableRows.findIndex(
      (candidate) => candidate.id === row.id,
    );
    if (anchorIndex === -1 || clickedIndex === -1) return false;
    const next: RowSelectionState = merge ? { ...selection.selected } : {};
    const from = Math.min(anchorIndex, clickedIndex);
    const to = Math.max(anchorIndex, clickedIndex);
    for (let index = from; index <= to; index++) {
      const candidate = tableRows[index];
      if (candidate.getCanSelect()) next[candidate.id] = true;
    }
    commitSelection(next);
    return true;
  }

  function handleCheckboxClick(row: Row<TaxonRecord>) {
    if (applyShiftRange(row, true)) return;
    lastSelectedIdRef.current = row.id;
    commitSelection({
      ...selection.selected,
      [row.id]: !selection.selected[row.id],
    });
  }

  const table = useReactTable({
    data: queryState.data,
    columns: taxonomyColumns,
    meta: {
      loadingParentIds: queryState.loading,
      onCheckboxClick: handleCheckboxClick,
      clearAnchor: () => {
        lastSelectedIdRef.current = null;
      },
    } satisfies TreeTableMeta,
    state: {
      expanded: globalFilter ? true : expanded,
      globalFilter,
      rowSelection: selection.selected,
    },
    getRowId: (row) => String(row.taxon_id),
    getSubRows: (row) =>
      isPlaceholder(row) ? undefined : queryState.children.get(numericId(row)),
    getRowCanExpand: (row) => {
      if (isPlaceholder(row.original) || isLeaf(row.original)) return false;
      if (row.getIsExpanded()) return true;
      const id = numericId(row.original);
      const loaded = queryState.children.get(id);
      const count = loaded
        ? loaded.filter((child) => !isPlaceholder(child)).length
        : (childCountsQuery.data?.get(id) ??
          knownChildCountsRef.current.get(id));
      return count !== undefined && count > 0;
    },
    enableRowSelection: (row) => !isPlaceholder(row.original),
    enableSubRowSelection: false,
    onExpandedChange: setExpanded,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: handleSelectionChange,
    globalFilterFn: (row, _columnId, value: string) =>
      !isPlaceholder(row.original) &&
      row.original.taxon_name.toLowerCase().includes(value.toLowerCase()),
    filterFromLeafRows: true,
    autoResetExpanded: false,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  tableRows = table.getRowModel().rows;

  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => taxonomyRowHeight,
    overscan: 15,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();
  const countableIds: number[] = [];
  for (const item of virtualItems) {
    const record = tableRows[item.index].original;
    const id = numericId(record);
    if (
      !isPlaceholder(record) &&
      !isLeaf(record) &&
      !queryState.children.has(id) &&
      !knownChildCountsRef.current.has(id)
    ) {
      countableIds.push(id);
    }
  }
  const deferredKey = useDeferredValue(countableIds.join(","));
  const deferredIds = deferredKey ? deferredKey.split(",").map(Number) : [];
  const childCountsQuery = useTaxonChildCounts(deferredIds);
  useLayoutEffect(() => {
    if (!childCountsQuery.isSuccess) return;
    const settledIds = deferredKey ? deferredKey.split(",").map(Number) : [];
    for (const id of settledIds) {
      knownChildCountsRef.current.set(id, childCountsQuery.data.get(id) ?? 0);
    }
  }, [childCountsQuery.data, childCountsQuery.isSuccess, deferredKey]);

  usePersistedExpansion(fetchParentIds, rootIds, globalFilter);

  function handleWhitespaceClick(row: Row<TaxonRecord>) {
    if (isPlaceholder(row.original) || applyShiftRange(row, false)) return;
    lastSelectedIdRef.current = row.id;
    if (ctrlOrCmdHeld) {
      commitSelection({
        ...selection.selected,
        [row.id]: !selection.selected[row.id],
      });
    } else {
      commitSelection({ [row.id]: true });
    }
  }

  return (
    <TreeTableView
      table={table}
      rows={tableRows}
      virtualItems={virtualItems}
      totalSize={rowVirtualizer.getTotalSize()}
      scrollRef={scrollRef}
      globalFilter={globalFilter}
      setGlobalFilter={setGlobalFilter}
      hasSelection={selection.records.size > 0}
      clearSelection={() => {
        lastSelectedIdRef.current = null;
        commitSelection({});
      }}
      handleRowClick={handleWhitespaceClick}
      modifierHeld={shiftHeld || ctrlOrCmdHeld}
    />
  );
}

class SelectionResetBoundary extends Component<{
  children: ReactNode;
  onSelect?: (rows: TaxonRecord[]) => void;
}> {
  componentDidMount() {
    this.props.onSelect?.([]);
  }

  render() {
    return this.props.children;
  }
}

export function TaxonomyTree({ rootTaxa, onSelect }: TaxonomyTreeProps) {
  const searchParams = useSearchParams();
  const signature = rootSignature(rootTaxa);
  return (
    <SelectionResetBoundary key={signature} onSelect={onSelect}>
      <TaxonomyTreeInstance
        rootRecords={rootTaxa.map(rootToRecord)}
        rootIds={rootTaxa.map((taxon) => taxon.taxonId)}
        open={searchParams.get("open")}
        onSelect={onSelect}
      />
    </SelectionResetBoundary>
  );
}
