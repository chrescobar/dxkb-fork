"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useKeyHold } from "@tanstack/react-hotkeys";
import {
  type ColumnDef,
  type ExpandedState,
  type Row,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronRight, Loader2, Network, X } from "lucide-react";
import clsx from "clsx";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { numberFormatter } from "@/lib/services/organisms/utils";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

import { fetchTaxonChildren, taxonChildrenKey, useTaxonChildCounts } from "./use-taxon-children";
import { isLeaf, rankBadgeDefault, rankConfig, type TaxonRecord } from "./taxon-tree-types";

const indentPx = 16;
const rowHeight = 32; // h-8, matches reference-genomes-client.tsx touch target
// Caps initial fetch fan-out on load and URL length on write — both sides must use the same value.
const maxOpenParam = 20;

// Synthetic non-data row shown beneath an expanded node when the fetch fails.
// (Loading shows an inline chevron spinner; empty hides the arrow — neither
// inserts a row.) Marked via __state so it renders as muted text and is never
// selectable or expandable.
type RowState = "error";
interface PlaceholderRecord extends TaxonRecord {
  __state: RowState;
  __message?: string;
}

function isPlaceholder(record: TaxonRecord): record is PlaceholderRecord {
  return typeof (record as PlaceholderRecord).__state === "string";
}

function numericId(record: TaxonRecord): number {
  return Number(record.taxon_id);
}

function placeholder(parentId: number, state: RowState, message?: string): PlaceholderRecord {
  return {
    taxon_id: `__ph_${state}_${String(parentId)}`,
    taxon_name: "",
    taxon_rank: "",
    __state: state,
    __message: message,
  };
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

interface TaxonomyTreeProps {
  rootTaxon: OrganismTaxonomy;
  onSelect?: (rows: TaxonRecord[]) => void;
}

export function TaxonomyTree({ rootTaxon, onSelect }: TaxonomyTreeProps) {
  "use no memo";

  const rootRecord = useMemo(() => rootToRecord(rootTaxon), [rootTaxon]);
  const rootId = numericId(rootRecord);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // User-driven expansion. Root auto-expanded one level (legacy parity). Any node
  // ids in the `open` search param are seeded expanded too, so a deep-linked view
  // reloads at the same expansion (each seeded ancestor drives its own fetch via
  // fetchParentIds). Read once on mount — later URL writes are one-way (below).
  const [expanded, setExpanded] = useState<ExpandedState>(() => {
    const initial: Record<string, boolean> = { [String(rootId)]: true };
    const open = searchParams.get("open");
    if (open) {
      for (const id of open.split(",").slice(0, maxOpenParam)) {
        const parsed = Number(id);
        if (Number.isInteger(parsed) && parsed > 0) initial[String(parsed)] = true;
      }
    }
    return initial;
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  // Parents whose children fetch is in flight. Read (fresh) inside the memoized
  // columns via ref to drive the inline chevron spinner without a stale closure.
  const loadingParentIdsRef = useRef<Set<number>>(new Set());
  // Accumulated per-id child counts (id → count). Immutable within a session, so
  // once resolved a count is never refetched or blanked — this is what kills the flash.
  const knownChildCountsRef = useRef<Map<number, number>>(new Map());
  // Records keyed by row-id for every taxon that has ever appeared in the model.
  // Survives accordion collapse (which removes children from the row model) so that
  // selected-but-hidden children are still resolvable when rowSelection changes.
  const recordCacheRef = useRef<Map<string, TaxonRecord>>(new Map());

  // Only manually-expanded, real, non-leaf nodes drive fetches. The filter may
  // expand everything visually (below) without adding to this set — so name
  // search stays a filter over already-loaded rows (no fan-out fetch).
  const fetchParentIds = useMemo(() => {
    if (expanded === true) return [rootId];
    return Object.keys(expanded)
      .filter((id) => expanded[id])
      .map(Number)
      .filter((id) => Number.isFinite(id));
  }, [expanded, rootId]);

  const childQueries = useQueries({
    queries: fetchParentIds.map((parentId) => ({
      queryKey: taxonChildrenKey(parentId),
      queryFn: () => fetchTaxonChildren(parentId),
    })),
  });

  // parentId -> child rows (real, or a single error placeholder). Rebuilt each
  // render (bounded by the expanded node count — cheap), so no memo. Pending
  // parents get NO child row — the chevron shows an inline spinner instead
  // (loadingParentIds), so expanding never inserts then removes a "Loading…" row.
  const childrenMap = new Map<number, TaxonRecord[]>();
  const loadingParentIds = new Set<number>();
  fetchParentIds.forEach((parentId, i) => {
    const q = childQueries[i];
    if (q.isPending) {
      loadingParentIds.add(parentId);
    } else if (q.isError) {
      childrenMap.set(parentId, [placeholder(parentId, "error", q.error.message)]);
    } else if (q.data.length === 0) {
      childrenMap.set(parentId, []);
    } else {
      childrenMap.set(parentId, q.data);
    }
  });
  loadingParentIdsRef.current = loadingParentIds;

  // Authoritative count for a node: loaded children length if we have them, else the
  // cached facet count, else undefined (still in flight → no arrow yet, appears once
  // the count resolves). Known ids never return undefined, so no flash.
  function childCount(id: number): number | undefined {
    const loaded = childrenMap.get(id);
    if (loaded) return loaded.filter((c) => !isPlaceholder(c)).length;
    return knownChildCountsRef.current.get(id);
  }

  const columns = useMemo<ColumnDef<TaxonRecord>[]>(
    () => [
      {
        id: "__select__",
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="Select all"
            checked={table.getIsAllRowsSelected()}
            ref={(el) => {
              if (el) el.indeterminate = table.getIsSomeRowsSelected();
            }}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) =>
          isPlaceholder(row.original) ? null : (
            <input
              type="checkbox"
              aria-label={`Select ${row.original.taxon_name}`}
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onChange={row.getToggleSelectedHandler()}
              onClick={(e) => { e.stopPropagation(); }}
            />
          ),
        size: 36,
      },
      {
        id: "taxon_name",
        accessorKey: "taxon_name",
        header: "Name",
        cell: ({ row }) => {
          const record = row.original;
          if (isPlaceholder(record)) {
            return (
              <span
                style={{ paddingLeft: row.depth * indentPx }}
                className="text-xs text-red-600"
              >
                {`Error: ${record.__message ?? "failed to load sub-taxa"}`}
              </span>
            );
          }
          return (
            <span className="flex items-center" style={{ paddingLeft: row.depth * indentPx }}>
              {row.getCanExpand() ? (
                <button
                  type="button"
                  aria-label={row.getIsExpanded() ? "Collapse" : "Expand"}
                  className="mr-1 flex size-4 items-center justify-center text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    row.toggleExpanded();
                  }}
                >
                  {row.getIsExpanded() &&
                  loadingParentIdsRef.current.has(numericId(row.original)) ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ChevronRight
                      className={clsx(
                        "size-3.5 transition-transform duration-200",
                        row.getIsExpanded() && "rotate-90",
                      )}
                    />
                  )}
                </button>
              ) : (
                <span className="mr-1 inline-block size-4" />
              )}
              <Link
                href={`/taxonomy/${String(record.taxon_id)}`}
                className="truncate text-primary hover:underline dark:text-blue-400"
                onClick={(e) => { e.stopPropagation(); }}
              >
                {record.taxon_name}
              </Link>
            </span>
          );
        },
      },
      {
        id: "taxon_rank",
        accessorKey: "taxon_rank",
        header: "Rank",
        cell: ({ row }) => {
          const rank = row.original.taxon_rank;
          if (isPlaceholder(row.original) || !rank) return null;
          return (
            <Badge
              variant="outline"
              className={clsx("px-1.5 py-0 text-[10px] font-normal", rankConfig[rank] ?? rankBadgeDefault)}
            >
              {rank}
            </Badge>
          );
        },
        size: 120,
      },
      {
        id: "genomes",
        accessorKey: "genomes",
        header: "Genomes",
        cell: ({ row }) => {
          if (isPlaceholder(row.original)) return null;
          const g = row.original.genomes;
          return typeof g === "number" ? numberFormatter.format(g) : "";
        },
        size: 100,
      },
      {
        id: "trees",
        header: "Trees",
        // Root row only (legacy parity). Disabled for now — will deep-link to the
        // Phylogeny tab once that view lands.
        cell: ({ row }) =>
          isPlaceholder(row.original) || row.depth !== 0 ? null : (
            <button
              type="button"
              disabled
              aria-label="View phylogenetic tree (coming soon)"
              title="Phylogenetic tree — coming soon"
              className="flex size-4 cursor-not-allowed items-center justify-center text-emerald-600 opacity-60"
              onClick={(e) => { e.stopPropagation(); }}
            >
              <Network className="size-3.5" />
            </button>
          ),
        size: 64,
      },
    ],
    [],
  );

  // TanStack memoizes the core row model on `data` identity, and getSubRows runs
  // only when that model rebuilds. So `data` must get a new identity exactly when
  // the tree content changes (a query newly expands, settles, empties, or errors)
  // — no more, no less. A fresh array every render rebuilds the model every render,
  // which storms the virtualizer (re-measure → setState → re-render) and churns the
  // query observers into duplicate fetches. Key it on a signature of the child
  // queries instead: identity stable between settles, fresh the moment one changes.
  // A derived ref (not useMemo) so the signature is a real identity key, not a
  // dependency exhaustive-deps would flag as unused in the memo body.
  // NOTE: child counts are deliberately NOT in this signature. They only affect the
  // expand-arrow (getRowCanExpand, re-run every render) and the count badge (a cell,
  // re-rendered via childCountRef) — neither needs the row MODEL rebuilt. Including
  // them forced a second full 165-row rebuild on every facet settle (the lag).
  const childrenSignature = childQueries
    .map((q, i) => `${String(fetchParentIds[i])}:${q.status}:${String(q.dataUpdatedAt)}`)
    .join("|");
  const dataRef = useRef<TaxonRecord[]>([rootRecord]);
  const signatureRef = useRef(childrenSignature);
  const prevRootIdRef = useRef(rootId);
  if (prevRootIdRef.current !== rootId) {
    prevRootIdRef.current = rootId;
    recordCacheRef.current.clear();
    // Root changed in place (Name link navigates within the [taxonId] segment, no
    // remount). Reset controlled table state keyed to the old root: re-seed expanded
    // so the new root auto-expands and drives its fetch, and drop the stale selection
    // (its records were just cleared from recordCacheRef).
    setExpanded({ [String(rootId)]: true });
    setRowSelection({});
    setGlobalFilter("");
  }
  if (signatureRef.current !== childrenSignature || dataRef.current[0] !== rootRecord) {
    signatureRef.current = childrenSignature;
    dataRef.current = [rootRecord];
  }
  const data = dataRef.current;

  const table = useReactTable({
    data,
    columns,
    state: {
      // When filtering, expand every loaded row so matches are revealed; this is
      // visual only and does not enlarge fetchParentIds.
      expanded: globalFilter ? true : expanded,
      globalFilter,
      rowSelection,
    },
    getRowId: (row) => String(row.taxon_id),
    getSubRows: (row) => (isPlaceholder(row) ? undefined : childrenMap.get(numericId(row))),
    getRowCanExpand: (row) => {
      if (isPlaceholder(row.original) || isLeaf(row.original)) return false;
      // Expanded nodes stay expandable (to collapse). For collapsed nodes, show the
      // arrow only once we know there's ≥1 child (loaded or from facet); unknown →
      // no arrow yet, it pops in with the rest of the level when the facet resolves.
      if (row.getIsExpanded()) return true;
      const count = childCount(numericId(row.original));
      return count !== undefined && count > 0;
    },
    enableRowSelection: (row) => !isPlaceholder(row.original),
    enableSubRowSelection: false,
    onExpandedChange: setExpanded,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: (row, _columnId, value: string) => {
      const original = row.original;
      if (isPlaceholder(original)) return false;
      return original.taxon_name.toLowerCase().includes(value.toLowerCase());
    },
    // Filter from leaves up so an ancestor is kept when a descendant matches
    // (default top-down would drop the root when only a child name matches).
    filterFromLeafRows: true,
    // `data` gets a fresh identity each render (so getSubRows re-reads the live
    // childrenMap as queries settle). Auto-resets react to that by firing
    // onExpandedChange/onRowSelectionChange every render → setState loop. Disable
    // them: expansion/selection/filter are fully controlled here anyway.
    autoResetExpanded: false,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const rows = table.getRowModel().rows;

  // Keep a ref so the selection effect can read the latest table without adding
  // `table` to its dep array (table is recreated every render with "use no memo").
  const tableRef = useRef(table);
  tableRef.current = table;

  // Populate record cache from every row currently in the model. Runs each render;
  // intentionally monotonic — once a record is cached it stays, so selected children
  // remain resolvable after their parent accordion collapses and removes them from
  // getCoreRowModel().flatRows (childrenMap loses their parent entry on collapse).
  for (const row of table.getCoreRowModel().flatRows) {
    if (!isPlaceholder(row.original)) {
      recordCacheRef.current.set(row.id, row.original);
    }
  }

  // Drive onSelect from rowSelection so BOTH row-body clicks and checkbox clicks
  // update the panel. Uses recordCacheRef instead of getSelectedRowModel() because
  // the latter only returns rows currently in the model — collapsed children are in
  // rowSelection but absent from the model, causing their count to drop to zero.
  useEffect(() => {
    const selected = Object.keys(rowSelection)
      .filter(id => rowSelection[id])
      .flatMap(id => {
        const record = recordCacheRef.current.get(id);
        return record ? [record] : [];
      });
    onSelect?.(selected);
  }, [rowSelection, onSelect]);

  // Virtualize the row render: a node can have tens of thousands of children (H1N1
  // subtype ≈ 35.9k). Rendering them all flat is ~144k DOM nodes → the page OOM-crashes.
  // Only the ~30 rows in view (+ overscan) hit the DOM; padding <tr>s reserve the rest
  // of the scroll height. Mirrors reference-genomes-client.tsx. Fixed rowHeight (32) so
  // no per-row measurement — that's why the max-height collapse animation had to go.
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 15,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualItems[0]?.start ?? 0;
  const paddingBottom =
    virtualItems.length > 0
      ? rowVirtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end ?? 0)
      : 0;

  // Child-count facet, scoped to the VISIBLE window only. Any non-leaf visible row
  // whose children we haven't loaded (not in childrenMap) needs its count to decide the
  // expand arrow + badge. Building this from all childrenMap values would put 35.9k ids
  // into one in(parent_id,(…)) facet URL (~250 KB) → request fails; the virtual window
  // caps it at ~30 ids. Persistent per-id cache (knownChildCountsRef) + staleTime:Infinity
  // dedupe across scrolls, so a resolved count is never refetched or blanked (no flash).
  const countableIds: number[] = [];
  for (const virtualItem of virtualItems) {
    const rec = rows[virtualItem.index].original;
    const id = numericId(rec);
    if (!isPlaceholder(rec) && !isLeaf(rec) && !childrenMap.has(id) && !knownChildCountsRef.current.has(id)) {
      countableIds.push(id);
    }
  }
  // Defer the facet to the SETTLED window. The virtualizer fires a state update per
  // scroll frame, giving countableIds a fresh id-set (→ fresh query key) every render.
  // Fetching per frame during a fast scroll piles up abandoned requests against the
  // 6-connection cap, so the window you land on never resolves and its pills stay blank.
  // useDeferredValue holds the previous key through the urgent scroll re-renders and only
  // catches up once scrolling goes idle → one request for the window you actually stop on.
  const countableKey = countableIds.join(",");
  const deferredKey = useDeferredValue(countableKey);
  const deferredIds = deferredKey ? deferredKey.split(",").map(Number) : [];
  const childCountsQuery = useTaxonChildCounts(deferredIds);
  if (childCountsQuery.isSuccess) {
    // On isSuccess the data matches the current key (= deferredIds), so write those.
    for (const id of deferredIds) {
      knownChildCountsRef.current.set(id, childCountsQuery.data.get(id) ?? 0);
    }
  }

  // Anchor for shift-click range selection: the last row toggled by a plain click.
  const lastSelectedIdRef = useRef<string | null>(null);
  const shiftHeld = useKeyHold("Shift");

  function handleRowClick(row: Row<TaxonRecord>) {
    if (isPlaceholder(row.original)) return;

    const anchorId = lastSelectedIdRef.current;
    if (shiftHeld && anchorId) {
      const anchorIndex = rows.findIndex((r) => r.id === anchorId);
      const clickedIndex = rows.findIndex((r) => r.id === row.id);
      if (anchorIndex !== -1 && clickedIndex !== -1) {
        const [from, to] = anchorIndex < clickedIndex
          ? [anchorIndex, clickedIndex]
          : [clickedIndex, anchorIndex];
        setRowSelection((prev) => {
          const next = { ...prev };
          for (let i = from; i <= to; i++) {
            const r = rows[i];
            if (r.getCanSelect()) next[r.id] = true;
          }
          return next;
        });
        return;
      }
    }

    lastSelectedIdRef.current = row.id;
    row.toggleSelected();
  }

  // Persist expanded nodes (minus the always-open root) to the `open` search param
  // so the view is shareable / survives reload. Uses history.replaceState, NOT
  // router.replace: router.replace triggers an App Router navigation (RSC round-trip
  // + full client re-render) on every expand/collapse — a major source of the lag.
  // The URL is display/reload state only; nothing in this tree reads it after mount,
  // so a bare history entry update is enough. Guarded by a ref (not searchParams,
  // which no longer reflects our manual writes) to skip no-op writes.
  const openParam = fetchParentIds.filter((id) => id !== rootId).sort((a, b) => a - b).slice(0, maxOpenParam).join(",");
  const lastOpenParamRef = useRef<string | null>(null);
  useEffect(() => {
    if (globalFilter) return;
    if (lastOpenParamRef.current === openParam) return;
    lastOpenParamRef.current = openParam;
    const params = new URLSearchParams(window.location.search);
    if (openParam) params.set("open", openParam);
    else params.delete("open");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }, [openParam, globalFilter, pathname]);

  const hasSelection = Object.values(rowSelection).some(Boolean);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden text-xs">
      <div className="flex items-center gap-2 py-2">
        <input
          type="search"
          value={globalFilter}
          onChange={(e) => { setGlobalFilter(e.target.value); }}
          placeholder="Search by taxonomy name…"
          aria-label="Search by taxonomy name"
          className="w-full max-w-96 rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        {hasSelection && (
          <button
            type="button"
            aria-label="Clear selected"
            onClick={() => { setRowSelection({}); }}
            className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3" />
            Clear selected
          </button>
        )}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
      <div className={clsx("h-full overflow-auto", shiftHeld && "select-none")} ref={scrollRef}>
        <Table className="w-full table-auto border-collapse text-xs" disableScrollWrapper>
          <TableHeader
            className="bg-muted text-foreground "
            style={{ position: "sticky", top: 0, zIndex: 30 }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="flex border-y border-border bg-muted">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="flex items-center border-r border-border px-2 py-0"
                    style={{
                      width: header.getSize() || undefined,
                      height: rowHeight,
                      flex: header.column.id === "taxon_name" ? 1 : undefined,
                      justifyContent:
                        header.column.id === "__select__" || header.column.id === "trees"
                          ? "center"
                          : header.column.id === "genomes"
                            ? "flex-end"
                            : undefined,
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="flex w-full">
                <TableCell className="w-full border-t border-border py-8 text-center text-muted-foreground">
                  No results
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paddingTop > 0 && <tr style={{ height: paddingTop }} />}
                {virtualItems.map((virtualItem) => {
                  const row = rows[virtualItem.index];
                  return (
                    <TableRow
                      key={row.id}
                      onClick={() => { handleRowClick(row); }}
                      style={{ display: "flex", height: rowHeight }}
                      className={clsx(
                        "cursor-pointer items-center",
                        row.getIsSelected() ? "bg-primary/15 dark:bg-primary/30" : "hover:bg-muted",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="flex items-center overflow-hidden border-r border-border px-2"
                          style={{
                            width: cell.column.getSize() || undefined,
                            flex: cell.column.id === "taxon_name" ? 1 : undefined,
                            height: rowHeight,
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            justifyContent:
                              cell.column.id === "__select__" || cell.column.id === "trees"
                                ? "center"
                                : cell.column.id === "genomes"
                                  ? "flex-end"
                                  : "flex-start",
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
                {paddingBottom > 0 && (
                  <tr style={{ display: "flex", height: paddingBottom }}>
                    {table.getVisibleLeafColumns().map((col) => (
                      <td
                        key={col.id}
                        className="border-r border-border"
                        style={{
                          width: col.getSize() || undefined,
                          flex: col.id === "taxon_name" ? 1 : undefined,
                        }}
                      />
                    ))}
                  </tr>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
      </div>
    </div>
  );
}
