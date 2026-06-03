'use client';

import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
  SortingState,
  PaginationState,
  Header,
} from "@tanstack/react-table";

import { useMemo, useRef, useState, useEffect } from "react";
import { noop } from "@/lib/utils";
import { getIdField } from "@/constants/resources";

import { useVirtualizer } from "@tanstack/react-virtual";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import clsx from "clsx";
import { Button } from "@/components/ui/button";

interface ColumnInfo {
  id: string;
  label: string;
  visible?: boolean;
}

interface DataTableProps {
  id: string;
  data: Record<string, unknown>[];
  columns: ColumnInfo[];
  totalItems: number;
  resource: string;
  onSelectionChange?: (rows: Record<string, unknown>[]) => void;
  onGenomeSelect?: (id: string | null) => void;
  selectedIds?: string[];

  // Pagination
  pageIndex?: number;
  pageSize?: number;
  onPageChange?: (pageIndex: number) => void;

  // Sorting
  sorting?: SortingState;
  onSortingChange?: (newSorting: SortingState) => void;

  // column ordering
  columnOrder?: string[];
  onColumnOrderChange?: (order: string[]) => void;

  // column visibility
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (newVis: Record<string, boolean>) => void;

  // row selection (controlled)
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;

  // Cross-page selection
  isAllPagesSelected?: boolean;
  onAllPagesSelectionChange?: (selected: boolean) => void;
  totalSelectedCount?: number;

  // Optional download handler
  onDownloadAll?: (format: 'csv' | 'txt', visibleColumns: string[] | null) => void;
  // Loading indicator: parent can set this while data is being fetched
  isLoading?: boolean;

  onActiveRowChange?: (id: string | null) => void;
}

export function DataTable({ id: _id, data, columns, totalItems, resource, onSelectionChange, onGenomeSelect, selectedIds, pageIndex, pageSize, onPageChange, sorting:controlledSorting, onSortingChange, columnOrder, onColumnOrderChange, columnVisibility: controlledVisibility, onColumnVisibilityChange: onColumnVisibilityChangeProp, rowSelection: controlledRowSelection, onRowSelectionChange, isAllPagesSelected = false, onAllPagesSelectionChange, totalSelectedCount, onDownloadAll, isLoading = false, onActiveRowChange }: DataTableProps) {

  const [columnSizing, setColumnSizing] = useState<Record<string, number>>({});
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    controlledVisibility || {}
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  
  // Track which download button is currently downloading
  const [downloadingButton, setDownloadingButton] = useState<string | null>(null);

  const [internalRowSelection, setInternalRowSelection] = useState({});
  const rowSelection = controlledRowSelection !== undefined ? controlledRowSelection : internalRowSelection;

  // Store the original order of selected items to maintain consistency
  const [selectedItemsOrder, setSelectedItemsOrder] = useState<Map<string, number>>(new Map());

  // Pagination state: support both controlled (via pageIndex/pageSize props)
  // and uncontrolled usage. If parent provides pageIndex/pageSize we treat
  // pagination as controlled for that value; otherwise we keep internal state
  // so actions like resizing columns don't reset the current page to 0.
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: pageIndex ?? 0,
    pageSize: pageSize ?? 200,
  }));

  const idField = getIdField(resource);

  // Sync when parent provides controlled pageIndex/pageSize values
  useEffect(() => {
    if (pageIndex !== undefined && pageIndex !== pagination.pageIndex) {
      setPagination((prev) => ({ ...prev, pageIndex }));
    }
    if (pageSize !== undefined && pageSize !== pagination.pageSize) {
      setPagination((prev) => ({ ...prev, pageSize }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, pageSize]);

  const lastSelectedIndexRef = useRef<number | null>(null);

  const [onlyVisibleColumns, setOnlyVisibleColumns] = useState(false);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const resizeLineRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLTableSectionElement>(null);
  const isResizingRef = useRef(false);
  const preventClickRef = useRef<((e: Event) => void) | null>(null);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnMenuRef.current &&
        !columnMenuRef.current.contains(event.target as Node)
      ) {
        setShowColumnMenu(false);
      }
    };
  
    if (showColumnMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnMenu]);

  
  const columnDefs = useMemo<ColumnDef<Record<string, unknown>, unknown>[]>(() => {
    const checkboxColumn: ColumnDef<Record<string, unknown>> = {
      id: '__select__',
      header: ({ table }) => {
        // Check if all rows on current page are selected
        const allPageRowsSelected = table.getIsAllPageRowsSelected();
        const somePageRowsSelected = table.getIsSomePageRowsSelected();
        
        // Determine checkbox state - if all pages selected, always show checked
        // Otherwise show the state of the current page
        const isChecked = isAllPagesSelected || allPageRowsSelected;
        const isIndeterminate = !isAllPagesSelected && somePageRowsSelected;
        
        return (
          <div className="flex justify-center items-center w-full h-full relative">
            <input
              type="checkbox"
              checked={isChecked}
              ref={(el) => {
                if (el) {
                  el.indeterminate = isIndeterminate;
                }
              }}
              onChange={(e) => {
                e.stopPropagation();
                
                if (isAllPagesSelected) {
                  // If all pages are selected, deselect all (including cross-page)
                  onAllPagesSelectionChange?.(false);
                  table.toggleAllRowsSelected(false);
                  // Clear all row selections and notify parent (controlled case)
                  if (onRowSelectionChange) {
                    onRowSelectionChange({});
                  } else {
                    // ensure internal selection is cleared
                    table.setRowSelection({});
                  }
                } else if (allPageRowsSelected) {
                  // If all rows on current page are selected, clicking again deselects current page
                  table.toggleAllRowsSelected(false);
                } else {
                  // Otherwise, select all on current page
                  table.toggleAllRowsSelected(true);
                }
              }}
              className="cursor-pointer m-0 p-0"
              title={isAllPagesSelected ? "Click to deselect all results" : (allPageRowsSelected ? "Click to deselect this page" : "Click to select all on this page")}
            />
            {isAllPagesSelected && (
              <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[10px] text-blue-600 whitespace-nowrap z-50">
                All {totalItems} selected
              </div>
            )}
          </div>
        );
      },
      cell: ({ row, table }) => {
        return (
          <div className="flex justify-center items-center w-full h-full">
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={noop}
              onClick={(e) => {
                e.stopPropagation();

                const isShift = (e as React.MouseEvent<HTMLInputElement>).shiftKey;
                const allRows = table.getRowModel().rows;
                const currentRowId = row.id;
                const currentIndex = allRows.findIndex(r => r.id === currentRowId);

                if (currentIndex === -1) {
                  console.warn('Could not find current row index');
                  return;
                }

                const lastSelectedIndex = lastSelectedIndexRef.current;

                // Determine whether this click will select or deselect the row based on current state
                const wasSelected = row.getIsSelected();
                const willSelect = !wasSelected;

                if (isShift && lastSelectedIndex !== null && lastSelectedIndex !== currentIndex) {
                  const start = Math.min(lastSelectedIndex, currentIndex);
                  const end = Math.max(lastSelectedIndex, currentIndex);

                  const newSelection: Record<string, boolean> = {};
                  for (let i = start; i <= end; i++) {
                    const rowId = allRows[i]?.id;
                    if (rowId) {
                      newSelection[rowId] = true;
                    }
                  }

                  table.setRowSelection((prev) => ({
                    ...prev,
                    ...newSelection,
                  }));
                } else {
                  table.setRowSelection((prev) => ({
                    ...prev,
                    [row.id]: willSelect,
                  }));
                }

                // ✅ Set synchronously
                lastSelectedIndexRef.current = currentIndex;

                // After updating rowSelection, invoke handlers based on the intended new selection state
                const idVal = row.original[idField] ?? row.original['genome_id'] ?? null;
                if (!willSelect) {
                  onGenomeSelect?.(null); // deselecting, so clear
                  onActiveRowChange?.(null);
                } else if (idVal != null) {
                  onGenomeSelect?.(String(idVal));
                  onActiveRowChange?.(String(idVal));
                }
              }}
              className="cursor-pointer m-0 p-0"
            />
          </div>
        );
      },
      enableResizing: false,
      size: 40,
    };
    return [
      checkboxColumn,
      ...columns.map((col) => ({
        accessorKey: col.id,
        header: col.label,
        cell: (info) => {
          const value = info.getValue();
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            const date = new Date(value);
            return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
          }
          return value;
        },
        size: 200,
        enableResizing: true,
        enableSorting: true,
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue(columnId);
          const b = rowB.getValue(columnId);
      
          // Treat empty/undefined/null as "last"
          const aIsEmpty = a === undefined || a === null || a === '';
          const bIsEmpty = b === undefined || b === null || b === '';
      
          if (aIsEmpty && bIsEmpty) return 0;
          if (aIsEmpty) return 1;
          if (bIsEmpty) return -1;
      
          // Normal string/number compare
          return a > b ? 1 : a < b ? -1 : 0;
        },
      }))
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: columnDefs,
    state: {
      sorting: controlledSorting ?? [],
      // use the internal pagination state (which is kept in sync with
      // controlled props when provided). This prevents ephemeral UI
      // operations like column-resize from resetting the active page.
      pagination,
      columnOrder,
      columnVisibility,
      columnSizing,
      rowSelection,
    },
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      
      // If any individual row selection changes, clear the "all pages selected" state
      if (isAllPagesSelected) {
        onAllPagesSelectionChange?.(false);
      }
      
      // Update the order map for selected items
      const newOrderMap = new Map(selectedItemsOrder);
      Object.keys(newSelection).forEach((rowId) => {
        if (newSelection[rowId] && !selectedItemsOrder.has(rowId)) {
          // Add new selections with their current order
          newOrderMap.set(rowId, newOrderMap.size);
        } else if (!newSelection[rowId]) {
          // Remove deselected items
          newOrderMap.delete(rowId);
        }
      });
      setSelectedItemsOrder(newOrderMap);
      
      // If controlled, call the parent handler
      if (onRowSelectionChange) {
        onRowSelectionChange(newSelection);
      } else {
        // Otherwise update internal state
        setInternalRowSelection(newSelection);
      }

      if (onSelectionChange) {
        const selectedRows = Object.keys(newSelection)
          .filter((key) => newSelection[key])
          .map((key) => table.getRowModel().rows.find(r => r.id === key)?.original)
          .filter((row): row is Record<string, unknown> => row !== undefined);
        onSelectionChange(selectedRows);
      }
    },

    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === 'function'
          ? updater(controlledSorting ?? [])
          : updater;

      // Reset to first page
      table.setPageIndex(0);

      // Notify parent (parent will handle clearing selection)
      onSortingChange?.(newSorting);
      },

    onColumnVisibilityChange: (updater) => {
      const newVis =
        typeof updater === 'function' ? updater(columnVisibility) : updater;

      setColumnVisibility(newVis);

      if (onColumnVisibilityChangeProp) {
        onColumnVisibilityChangeProp(newVis);
      }

      // Trigger a recalculation of column sizing on visibility toggle
      setColumnSizing((prev) => {
        const updated = { ...prev };
        table.getAllLeafColumns().forEach((col) => {
          if (!updated[col.id]) {
            updated[col.id] = col.getSize();
          }
        });
        return updated;
      });
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater;

      // Update internal pagination state so the UI stays on the same page
      // during interactions like resizing. If the parent controls pageIndex
      // it will be synced via the effect above.
      setPagination(next);

      // Notify parent of page change (if provided)
      onPageChange?.(next.pageIndex);
    },
    onColumnOrderChange: onColumnOrderChange ? (updater) => {
      const newOrder =
        typeof updater === 'function'
          ? updater(columnOrder ?? [])
          : updater;

      onColumnOrderChange(newOrder);
    } : undefined,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalItems / (pagination.pageSize ?? 200)),
    columnResizeMode: 'onEnd',
    enableColumnResizing: true,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    enableSortingRemoval: false,
    enableMultiRowSelection: true,
//    getRowId: (row, index) => String((row as any).genome_id ?? `${index}`)
    getRowId: (row) => String(row[idField]),
  });


  const columnSizingState = table.getState().columnSizing;
  const columnSizingInfoState = table.getState().columnSizingInfo;

  const columnSizeVars = useMemo(() => {
    const headers = table.getFlatHeaders();
    const colSizes: Record<string, string> = {};
    for (const header of headers) {
      colSizes[`--col-${header.column.id}-size`] = `${header.column.getSize()}px`;
    }
    return colSizes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnSizingState, columnSizingInfoState]);

  const rows = table.getRowModel().rows;

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 24,
    overscan: 10,
    getItemKey: (index) => table.getRowModel().rows[index]?.id,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const handleResizeStart = (event: React.MouseEvent, header: Header<Record<string, unknown>, unknown>) => {
    event.preventDefault();

    const startX = event.clientX;
    const column = header.column;
    const startSize = column.getSize();
    const colElement = event.currentTarget.closest('th') as HTMLElement;
    if (!colElement) return;

    const tableEl = colElement.closest('table');
    if (!tableEl) return;
    const tableRect = tableEl.getBoundingClientRect();

    if (resizeLineRef.current) { // Make the ghost line appear
      resizeLineRef.current.style.left = `${colElement.getBoundingClientRect().right - tableRect.left}px`;
      resizeLineRef.current.style.display = 'block';
    }

    const onMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      const newSize = Math.max(40, startSize + delta);

      if (resizeLineRef.current) { // Make the ghost line move
        resizeLineRef.current.style.left = `${colElement.getBoundingClientRect().left - tableRect.left + newSize}px`;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      const finalSize = Math.max(40, startSize + delta);

      setColumnSizing((prev) => ({
        ...prev,
        [column.id]: finalSize,
      }));

      if (resizeLineRef.current) { // Make the ghost line go away
        resizeLineRef.current.style.display = 'none';
      }

      // Remove listeners. Keep the temporary click blocker active for a
      // short while to catch the browser's synthesized click event that
      // often follows mouseup after a drag/resize. Clean up after 50ms.
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setTimeout(() => {
        if (preventClickRef.current) {
          document.removeEventListener('click', preventClickRef.current, true);
          preventClickRef.current = null;
        }
        isResizingRef.current = false;
      }, 50);
    };

    // mark that a resize interaction is in progress
    isResizingRef.current = true;

    // Block click events during the resize (capture phase) so browsers
    // that emit a click after mouseup don't trigger header sorting.
    preventClickRef.current = (ev: Event) => {
      ev.stopPropagation();
      ev.preventDefault();
    };
    document.addEventListener('click', preventClickRef.current, true);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Handle column drag start
  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggedColumn(columnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle column drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle column drop
  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    
    if (!draggedColumn || draggedColumn === targetColumnId) {
      setDraggedColumn(null);
      return;
    }

    const allColumns = table.getAllLeafColumns();
    const columnIds = allColumns.map(col => col.id);
    
    const draggedIndex = columnIds.indexOf(draggedColumn);
    const targetIndex = columnIds.indexOf(targetColumnId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedColumn(null);
      return;
    }

    // Create new column order
    const newOrder = [...columnIds];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);
    
    // Update column order
    onColumnOrderChange?.(newOrder);
    setDraggedColumn(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedColumn(null);
  };

  const handleDownload = async (format: 'csv' | 'txt', onlySelected = false) => {
    // Set downloading state
    const buttonKey = `${format}-${onlySelected ? 'selected' : 'all'}`;
    setDownloadingButton(buttonKey);
    
    try {
      // If downloading selected and all pages are selected, download all data
      if (onlySelected && isAllPagesSelected && onDownloadAll) {
        const allCols = table.getAllLeafColumns();
        const visibleCols = onlyVisibleColumns
          ? allCols.filter(col => col.getIsVisible() && col.id !== '__select__')
          : allCols.filter(col => col.id !== '__select__');
        
        const visibleColumnIds = visibleCols.map(col => col.id);
        await onDownloadAll(format, onlyVisibleColumns ? visibleColumnIds : null);
        setDownloadingButton(null);
        return;
      }
      
      // If downloading all data and onDownloadAll is provided, use it
      if (!onlySelected && onDownloadAll) {
        const allCols = table.getAllLeafColumns();
        const visibleCols = onlyVisibleColumns
          ? allCols.filter(col => col.getIsVisible() && col.id !== '__select__')
          : allCols.filter(col => col.id !== '__select__');
        
        const visibleColumnIds = visibleCols.map(col => col.id);
        await onDownloadAll(format, onlyVisibleColumns ? visibleColumnIds : null);
        setDownloadingButton(null);
        return;
      }

    // Otherwise, use the local download logic (for selected rows or when onDownloadAll is not provided)
    const allCols = table.getAllLeafColumns();
    const visibleCols = onlyVisibleColumns
      ? allCols.filter(col => col.getIsVisible() && col.id !== '__select__')
      : allCols.filter(col => col.id !== '__select__');

    const headers = visibleCols.map(col => col.columnDef.header as string);

    if (onlySelected) {
      if (!isAllPagesSelected && (!selectedIds || selectedIds.length === 0)) return;

      const idField = getIdField(resource);

      const idFilter = (selectedIds ?? [])
        .map((id) => `eq(${idField},${id})`)
        .join(",");

      const query = `or(${idFilter})`;

      const DataAPI = process.env.NEXT_PUBLIC_DATA_API;

      await fetch(`${DataAPI}/${resource}/?${query}`, {
        headers: { 
          Accept: "application/json",
          'Range': `items=0-${(selectedIds ?? []).length}`,
          'X-Range': `items=0-${(selectedIds ?? []).length}`,        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch selected rows");
          return res.json();
        })
        .then((data) => {
          const rowsArray: Record<string, unknown>[] = Array.isArray(data)
            ? data
            : data.items ?? data.response ?? data.rows ?? [];

          // Sort the rows based on the original selection order
          const sortedRows = rowsArray.sort((a, b) => {
            const aId = String(a[idField]);
            const bId = String(b[idField]);
            const aOrder = selectedItemsOrder.get(aId) ?? Number.MAX_VALUE;
            const bOrder = selectedItemsOrder.get(bId) ?? Number.MAX_VALUE;
            return aOrder - bOrder;
          });

          const content = [
            headers.join(','),
            ...sortedRows.map(row =>
              visibleCols.map(col => {
                const val = row[col.id];
                return typeof val === 'string'
                  ? `"${val.replace(/"/g, '""')}"`
                  : val ?? '';
              }).join(',')
            )
          ].join('\n');

          downloadFile(`${resource}-selected.${format}`, content);
        })
        .catch((err) => {
          console.error("Download selected failed:", err);
        })
        .finally(() => {
          setDownloadingButton(null);
        });

      return;
    }

    const rowsToExport = table.getPrePaginationRowModel().rows;

    const content = [
      headers.join(','),
      ...rowsToExport.map(row =>
        visibleCols.map(col => {
          const val = row.getValue(col.id);
          return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(',')
      )
    ].join('\n');

    downloadFile(`${resource}${onlySelected ? '-selected' : ''}.${format}`, content);
    setDownloadingButton(null);
    } catch (error) {
      console.error("Download failed:", error);
      setDownloadingButton(null);
    }
  };

  // Now that all the setup is done, let's render the table!
  return (
    <div className="flex min-h-0 flex-1 flex-col w-full text-xs relative items-center border-0 overflow-hidden">{/* This is the main container. Full width and content centered. */}
      {/* Banner for selecting all results across pages */}
      {!isAllPagesSelected && table.getIsAllPageRowsSelected() && (
          <div className="w-full bg-blue-50 border border-blue-200 px-4 py-2 mb-2 flex items-center justify-between">
          <span className="text-blue-700">
            All {data.length} results on this page are selected.
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onAllPagesSelectionChange?.(true);
            }}
            className="text-blue-700 underline hover:text-blue-900 font-semibold cursor-pointer"
          >
            Select all {totalItems} results across all pages
          </button>
        </div>
      )}
      {isAllPagesSelected && (
        <div className="w-full bg-blue-100 border border-blue-300 px-4 py-2 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-semibold">
              All {totalItems} results are selected across all pages.
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onAllPagesSelectionChange?.(false);
                table.toggleAllRowsSelected(false);
                if (onRowSelectionChange) {
                  onRowSelectionChange({});
                }
              }}
              className="text-blue-700 underline hover:text-blue-900 cursor-pointer"
            >
              Clear selection
            </button>
          </div>
          <div className="text-xs text-blue-700 mt-1">
            Note: Checkboxes on other pages may not appear checked for performance reasons, but all rows are selected.
          </div>
        </div>
      )}
      <div className="w-[100%] flex justify-end mb-2 z-50 px-5" ref={controlsRef}>
          <div className="relative inline-block text-left" ref={columnMenuRef}> {/* This is the button for changing the visibility of columns in the table */}
            <Button
              className="flex justify-end w-full rounded border border-gray-400 shadow-sm px-2 py-1 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 mr-2"
              onClick={() => setShowColumnMenu(prev => !prev)}
            >
              Columns ▾
            </Button>

            {showColumnMenu && (
              <div className="absolute left-0 mt-1 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1 max-h-64 overflow-auto text-xs">
                  {table.getAllColumns()
                    .filter(col => col.id !== '__select__')
                    .map((column) => (
                      <label
                        key={column.id}
                        className="flex items-center space-x-2 px-2 py-1 hover:bg-muted-foreground cursor-pointer text-black"
                      >
                        <input
                          type="checkbox"
                          checked={column.getIsVisible()}
                          onChange={() => column.toggleVisibility()}
                        />
                        <span>{column.columnDef.header as string}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Download buttons */}
          <Button
            onClick={() => handleDownload('csv')}
            className="rounded border border-gray-400 shadow-sm px-2 py-1 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 mr-2 ml-2"
            disabled={downloadingButton !== null}
          >
            {downloadingButton === 'csv-all' ? (
              <span className="text-red-600">Downloading...</span>
            ) : (
              'Download (CSV)'
            )}
          </Button>
          <Button
            onClick={() => handleDownload('txt')}
            className="rounded border border-gray-400 shadow-sm px-2 py-1 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 mr-2"
            disabled={downloadingButton !== null}
          >
            {downloadingButton === 'txt-all' ? (
              <span className="text-red-600">Downloading...</span>
            ) : (
              'Download (TXT)'
            )}
          </Button>

          {/* These next two only show up if rows are selected */}
          {((selectedIds?.length ?? 0) > 0 || isAllPagesSelected) && ( 
            <>
              <Button
                onClick={() => handleDownload('csv', true)}
                className="rounded border border-gray-400 shadow-sm px-2 py-1 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 mr-2"
                disabled={downloadingButton !== null}
              >
                {downloadingButton === 'csv-selected' ? (
                  <span className="text-red-600">Downloading...</span>
                ) : (
                  'Download Selected (CSV)'
                )}
              </Button>
              <Button
                onClick={() => handleDownload('txt', true)}
                className="rounded border border-gray-400 shadow-sm px-2 py-1 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 mr-2"
                disabled={downloadingButton !== null}
              >
                {downloadingButton === 'txt-selected' ? (
                  <span className="text-red-600">Downloading...</span>
                ) : (
                  'Download Selected (TXT)'
                )}
              </Button>
            </>
          )}
        
        <label className="flex items-center text-xs text-foreground ml-4">
          <input
            type="checkbox"
            checked={onlyVisibleColumns}
            onChange={() => setOnlyVisibleColumns(prev => !prev)}
            className="mr-1"
          />
          Download Displayed Columns Only
        </label>
      </div>
      <div className="w-full flex flex-col border border-gray-500 rounded relative h-[65vh] overflow-hidden"> {/* This is the main container, which contains both the table and the pagination footer. Use a fixed height (65vh) so the table area is strictly constrained and cannot expand the page. */}

        <div
          className="flex-1 overflow-auto relative"
          ref={tableContainerRef}
          style={{
            maxHeight: '100%',
            paddingBottom: '52px', // leave room for pagination footer
            position: 'relative',
          }}
        >
          {isLoading && (
            <div className="absolute inset-0 z-40 bg-white/60 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-t-transparent border-blue-600 rounded-full animate-spin" />
                <div className="text-sm text-foreground">Loading…</div>
              </div>
            </div>
          )}
          <div className="min-w-max relative" style={columnSizeVars}>
            <Table 
              className="w-full table-auto text-xs border-collapse relative" 
              style={{ borderSpacing: 0 }}
              disableScrollWrapper={true}
            >
              <TableHeader
                ref={headerRef}
                className="bg-primary text-secondary uppercase border-black"
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 30,
                }}
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="flex border-t border-b border-black bg-primary">
                    {headerGroup.headers.map((header) => {
                      const column = header.column;
                      return (
                        <TableHead
                          key={header.id}
                          colSpan={header.colSpan}
                          className={clsx(
                            'border-r border-l border-black bg-primary text-secondary relative',
                            column.id === '__select__'
                              ? 'p-0 flex justify-center items-center' // ✅ center checkbox
                              : 'px-2 py-0 text-sm font-bold leading-none align-middle cursor-pointer'
                          )}
                          style={{
                            width: `var(--col-${column.id}-size)`,
                            minWidth: `var(--col-${column.id}-size)`,
                            maxWidth: `var(--col-${column.id}-size)`,
                          }}
                          onClick={column.id !== '__select__' ? (e) => {
                            // If we were resizing just before this click, ignore the click
                            // because the browser may emit a click after mouseup when the
                            // user finishes resizing (particularly when shrinking a column).
                            if (isResizingRef.current) {
                              e.stopPropagation();
                              return;
                            }

                            e.stopPropagation();
                            const handler = column.getToggleSortingHandler();
                            if (handler) {
                              handler(e);
                            }
                          } : undefined}
                        >
                          {column.id === '__select__' ? (
                            // Checkbox column - no sorting or dragging
                            <div className="flex items-center justify-center w-full h-full py-0">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </div>
                          ) : (
                            // Regular column - sortable and draggable
                            <div 
                              className="flex items-center justify-between w-full h-full py-0 relative"
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, column.id)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, column.id)}
                              onDragEnd={handleDragEnd}
                              style={{
                                cursor: 'move',
                                opacity: draggedColumn === column.id ? 0.5 : 1,
                                backgroundColor: draggedColumn && draggedColumn !== column.id ? 'transparent' : '',
                              }}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <span className="select-none">{flexRender(header.column.columnDef.header, header.getContext())}</span>
                                <div className="flex flex-col justify-center items-center">
                                  {column.getIsSorted() === 'asc' ? (
                                    <span className="text-xs">▲</span>
                                  ) : column.getIsSorted() === 'desc' ? (
                                    <span className="text-xs">▼</span>
                                  ) : (
                                    <span className="text-xs opacity-30">⇅</span>
                                  )}
                                </div>
                              </div>
                              {column.getCanResize() && (
                                <div
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    handleResizeStart(e, header);
                                  }}
                                  className="absolute top-0 right-0 w-2 h-full cursor-col-resize z-30 hover:bg-blue-300"
                                  style={{ transform: 'translateX(50%)' }}
                                />
                              )}
                            </div>
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody
                style={{
                  position: 'relative',
                  height: totalSize,
                }}
                className="relative z-10 border-collapse gap-0"
              >
                {rows.length === 0 ? (
                <TableRow className="flex w-full h-24 items-center justify-center">
                  <TableCell
                    colSpan={table.getVisibleLeafColumns().length}
                    className="text-left w-full border-t border-black py-8 text-xl font-semibold text-foreground"
                    style={{ justifyContent: 'left' }}
                  >
                    No results
                  </TableCell>
                </TableRow>
              ) : (
                // If there ARE results...
                virtualRows.map((virtualRow) => {
//                  const row = rows[virtualRow.index];
                  const row = table.getRowModel().rows[virtualRow.index];
                  return (
                    <TableRow
                      key={row.id}
                      // Clicking a row should notify listeners about the active row (used to open side panels).
                      // If the click originated from a checkbox/input, avoid double-handling because
                      // the checkbox click handler already calls onActiveRowChange/onGenomeSelect.
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
                        const idVal = row.original[idField];
                        const genomeId = idVal ?? row.original['genome_id'] ?? null;
                        if (genomeId != null) {
                          onGenomeSelect?.(String(genomeId));
                          onActiveRowChange?.(String(genomeId));
                        }
                      }}
                      style={{
                        position: 'absolute',
                        transform: `translateY(${virtualRow.start}px)`,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        height: '24px',
                      }}
                      className={clsx(
                        row.getIsSelected()
                          ? 'bg-muted-foreground hover:bg-muted-foreground' // lock in yellow background
                          : 'hover:bg-muted-foreground' // only apply white hover if not selected
                      )}
                      
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className='py-1 border border-primary'
                          style={{
                            width: `var(--col-${cell.column.id}-size)`,
                            minWidth: `var(--col-${cell.column.id}-size)`,
                            maxWidth: `var(--col-${cell.column.id}-size)`,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'flex',
                            height: '24px',
                            alignItems: 'center',
                            justifyContent: cell.column.id === '__select__' ? 'center' : 'flex-start',
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
              </TableBody>
            </Table>

            <div
              ref={resizeLineRef}
              className="absolute top-0 bottom-0 w-[2px] bg-blue-600 opacity-50 pointer-events-none z-40"
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="bg-secondary py-3 border-t z-10 shadow-sm border-black w-full" ref={footerRef}>
          <div className="flex flex-col md:flex-row justify-between items-center px-4 space-y-2 md:space-y-0">
            <div>
              {(() => {
                const pageIndex = table.getState().pagination.pageIndex;
                const pageSize = table.getState().pagination.pageSize;
                const totalRows = totalItems; // total from backend
                const hasResults = totalItems > 0;
                const start = hasResults ? pageIndex * pageSize + 1 : 0;
                const end = hasResults ? Math.min(start + data.length - 1, totalRows): 0;
                
                // Show selection count if applicable
                const selectedCount = isAllPagesSelected 
                  ? totalItems 
                  : (totalSelectedCount ?? Object.keys(rowSelection).filter(key => rowSelection[key]).length);
                
                return (
                  <div className="flex flex-col gap-1">
                    <div>Showing {start}-{end} of {totalRows} results</div>
                    {selectedCount > 0 && (
                      <div className="text-blue-600 font-semibold">
                        {isAllPagesSelected 
                          ? `All ${totalItems} results selected` 
                          : `${selectedCount} selected`}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => {
                  table.previousPage();

                }}
                disabled={!table.getCanPreviousPage()}
                className="px-2 py-1 border border-primary disabled:opacity-50"
              >
                {'Prev'}
              </Button>
              {(() => {
                const pageCount = table.getPageCount();
                const currentPage = table.getState().pagination.pageIndex;
                const pages: number[] = [];

                if (pageCount > 0) pages.push(0);
                for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                  if (i > 0 && i < pageCount - 1) pages.push(i);
                }
                if (pageCount > 1) pages.push(pageCount - 1);
                const uniquePages = [...new Set(pages)].sort((a, b) => a - b);

                return uniquePages.map((page, idx) => {
                  const prev = uniquePages[idx - 1];
                  const showDots = prev !== undefined && page - prev > 1;
                  return (
                    <span key={page}>
                      {showDots && <span className="px-1">...</span>}
                      <Button
                        onClick={() => {
                          // Update table's internal state for immediate UI feedback
                          table.setPageIndex(page);
        
                        }}
                        className={clsx(
                          'px-3 py-1 border mx-1 bg-background text-foreground',
                          currentPage === page ? 'bg-muted-foreground font-bold' : 'bg-background'
                        )}
                      >
                        {page + 1}
                      </Button>
                    </span>
                  );
                });
              })()}
              {/* Forward arrow */}
              <Button
                onClick={() => {
                  table.nextPage();

                }}
                disabled={!table.getCanNextPage()}
                className="px-2 py-1 border border-primary disabled:opacity-50"
              >
                {'Next'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}