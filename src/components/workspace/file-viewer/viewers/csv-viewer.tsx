"use client";

import { useEffect, useRef, useState } from "react";
import { parse } from "csv-parse/sync";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

import { Spinner } from "@/components/ui/spinner";
import { getProxyUrl, previewMaxBytes } from "../file-viewer-registry";
import { CodeMirrorViewer } from "./codemirror-viewer";

interface CsvViewerProps {
  filePath: string;
  fileName: string;
  fileSize?: number;
}

export function CsvViewer({ filePath, fileName, fileSize }: CsvViewerProps) {
  if (fileSize && fileSize > previewMaxBytes) {
    return (
      <CodeMirrorViewer
        filePath={filePath}
        fileName={fileName}
        fileSize={fileSize}
      />
    );
  }

  return <InteractiveCsvViewer filePath={filePath} fileName={fileName} />;
}

const rowHeight = 33;

interface CsvData {
  records: Record<string, string>[];
  columnNames: string[];
  columns: ColumnDef<Record<string, string>, string>[];
}

const emptyCsvData: CsvData = {
  records: [],
  columnNames: [],
  columns: [],
};

function InteractiveCsvViewer({
  filePath,
  fileName,
}: {
  filePath: string;
  fileName: string;
}) {
  "use no memo";
  const [data, setData] = useState<CsvData>(emptyCsvData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    setLoading(true);
    setError(null);
    setData(emptyCsvData);

    fetch(getProxyUrl(filePath), { signal: controller.signal })
      .then((res) => {
        if (!res.ok)
          throw new Error(`Failed to fetch file: ${String(res.status)}`);
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;

        try {
          const delimiter = fileName.endsWith(".tsv") ? "\t" : ",";
          const records: Record<string, string>[] = parse(text, {
            delimiter,
            columns: true,
            skip_empty_lines: true,
            relax_column_count: true,
          });
          const columnNames = records[0] ? Object.keys(records[0]) : [];
          const columns = columnNames.map(
            (column): ColumnDef<Record<string, string>, string> => ({
              accessorFn: (row) => row[column] ?? "",
              id: column,
              header: column,
              cell: (info) => info.getValue(),
            }),
          );
          setData({ records, columnNames, columns });
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to parse CSV/TSV",
          );
        }
      })
      .catch((err: unknown) => {
        if (
          cancelled ||
          (err instanceof DOMException && err.name === "AbortError")
        )
          return;
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [fileName, filePath]);

  const { records, columnNames, columns } = data;

  const table = useReactTable({
    data: records,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => rowHeight,
    overscan: 20,
  });

  if (loading) {
    return (
      <div className="flex size-full items-center justify-center gap-2 text-muted-foreground">
        Loading... <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex size-full items-center justify-center text-destructive">
        {error}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex size-full items-center justify-center text-muted-foreground">
        No data found
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
        {records.length} rows · {columnNames.length} columns
      </div>
      <div ref={scrollContainerRef} className="size-full overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : "none"
                    }
                    className="border-b border-border p-0 text-left font-medium"
                  >
                    <button
                      type="button"
                      className="w-full cursor-pointer px-3 py-2 text-left select-none"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getIsSorted() === "asc"
                        ? " ↑"
                        : header.column.getIsSorted() === "desc"
                          ? " ↓"
                          : ""}
                    </button>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {virtualizer.getVirtualItems().length > 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    height: virtualizer.getVirtualItems()[0]?.start ?? 0,
                    padding: 0,
                    border: "none",
                  }}
                />
              </tr>
            )}
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows.at(virtualRow.index);
              if (!row) return null;
              return (
                <tr
                  key={row.id}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-1.5 whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
            {virtualizer.getVirtualItems().length > 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    height:
                      virtualizer.getTotalSize() -
                      (virtualizer.getVirtualItems().at(-1)?.end ?? 0),
                    padding: 0,
                    border: "none",
                  }}
                />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
