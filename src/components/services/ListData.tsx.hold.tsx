'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, usePathname } from "next/navigation";
import { DataTable } from '@/components/containers/DataTable';
import { SortingState, RowSelectionState } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';

interface ListDataProps { 
  q: string; 
  resource: string; // 'genome', 'gene', etc. 
  onSelectionChange?: (rows: any[]) => void; 
  }

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function ListData({q, resource, onSelectionChange }: ListDataProps) {
  const [fields, setFields] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});


  useEffect(() => {
    (async () => {
      const mod = await import(`@/constants/datafields/${resource}`);
      const fieldObj = mod[`${resource}Fields`];
      setFields(
        Object.values(fieldObj)
          .filter((f: any) => f.show_in_table !== false)
          .map((f: any) => ({ id: f.field, label: f.label, visible: !f.hidden }))
        );
      })();
    }, [resource]);

  const widget = {
    id: 'widget-1',
    columns: fields,
  };

  const searchParams = useSearchParams();
//  const q = searchParams.get('q') ?? '';

  console.log('Search params q:', q);

  const rawSearchType = searchParams.get('searchtype') ?? '';
  const searchtype = useMemo(() => {
    return rawSearchType ?? '';
  }, [rawSearchType]);
  const pathname = usePathname();
  const cleanQ = useMemo(() => {
    return q?.replace(/keyword\(|\)/g, '');
  }, [q]);
  const DataAPI = process.env.NEXT_PUBLIC_DATA_API!;
  const pageSize = 200;
  const listKey = `${resource}-${cleanQ}-${searchtype}`;

  useEffect(() => {
    console.log('Resource changed, resetting selection');
  }, [resource]);
  useEffect(() => {
    console.log('CleanQ changed, resetting selection');
  }, [cleanQ]);
  useEffect(() => {
    console.log('Searchtype changed, resetting selection');
  }, [searchtype]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  const visibilityInitialized = useRef(false);

  const [pageIndex, setPageIndex] = useState(0);

  const setSortingAndResetPage = (newSorting: SortingState) => {
    setSorting(newSorting);
    setPageIndex(0);
  };

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean> | null>(null);
  const [stableColumns, setStableColumns] = useState<any[] | null>(null);

  // Memoize columns so the array reference doesn't change between renders
  const memoColumns = useMemo(() => stableColumns ?? [], [stableColumns]);

  // Memoize visibility so the object reference is stable
  const memoVisibility = useMemo(() => columnVisibility ?? {}, [columnVisibility]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const mod = await import(`@/constants/datafields/${resource}`);
      const fieldObj = mod[`${resource}Fields`];

      const cols = Object.values(fieldObj)
        .filter((f: any) => f.show_in_table !== false)
        .map((f: any) => ({
          id: f.field,
          label: f.label,
          visible: !f.hidden,
        }));

      if (!cancelled) {
        setFields(cols);          // keep for metadata / downloads
        setStableColumns(cols);   // 🔒 this one NEVER changes
      }
    })();

    return () => {
      cancelled = true;
      setStableColumns(null); // only reset on resource change
    };
  }, [resource]);

  useEffect(() => {
    if (!stableColumns || visibilityInitialized.current) return;

    const vis: Record<string, boolean> = { __select__: true };
    stableColumns.forEach(c => {
      vis[c.id] = c.visible !== false;
    });

    setColumnVisibility(vis);
    visibilityInitialized.current = true;
  }, [stableColumns]);

  useEffect(() => {
    visibilityInitialized.current = false;
    setColumnVisibility(null);
  }, [resource]);

  useEffect(() => {
    if (fields.length) {
      setColumnOrder(['__select__', ...fields.map(f => f.id)]);
    }
  }, [fields]);

  const sortingKey =
  sorting.length > 0
    ? `${sorting[0].id}:${sorting[0].desc ? 'desc' : 'asc'}`
    : 'none';

  // Fetch metadata (numFound)
  const { data: metaData, isLoading: metaLoading, error: metaError, refetch: metaRefetch  } = useQuery({
    queryKey: ['genome-meta', resource, cleanQ, searchtype],
    queryFn: async () => {
      const baseURL = `${DataAPI}/${resource}/?${cleanQ}`;
      console.log('Fetching metadata from URL:', baseURL);
      const res = await fetch(`${baseURL}&limit(1)`, {
        headers: { 
          'Accept': 'application/solr+json'
          }
      });
      if (!res.ok) throw new Error('Failed to fetch metadata');
      return res.json();
    },
    staleTime: 30_000,
    refetchOnMount: false,
  });

// Compute totalItems safely
const totalItems = metaData?.response?.numFound ?? 0;

// Fetch current page of data
const { data: pageData, isLoading: dataLoading, error: dataError } = useQuery({
  queryKey: [
    'genome-full',
    resource,
    cleanQ,
    pageIndex,    // must be here
    sortingKey,
    searchtype
  ],
  queryFn: async () => {
    const total = metaData?.response?.numFound ?? 0;
    console.log('Total items from metadata:', total);

    if (total === 0) return [];

    console.log('Fetching data for page:', pageIndex, 'with pageSize:', pageSize);

    const sortParam = sorting[0] ? `${sorting[0].desc ? '-' : '+'}${sorting[0].id}` : null;

    const start = pageIndex * pageSize;
    const end = start + pageSize;

    const baseURL = `${DataAPI}/${resource}/?${cleanQ}`;
    const url = sortParam ? `${baseURL}&sort(${sortParam})` : baseURL;

    console.log('REQUEST URL:', url);

    const res = await fetch(url, {
      headers: {
        'Content-type': 'application/rqlquery+x-www-form-urlencoded',
        'Accept': 'application/json',
        'Range': `items=${start}-${end}`,
        'X-Range': `items=${start}-${end}`,
        }
    });

    if (!res.ok) throw new Error('Failed to fetch genome data');
    return res.json();
  },
  enabled: totalItems > 0,
  keepPreviousData: true, // optional: avoids flicker
  staleTime: 0,
  refetchOnWindowFocus: false,
});

  if (metaError || dataError) {
    return (
      <div>
        Error: {(metaError || dataError)?.message}
        <br />
        Query: {JSON.stringify(q)}
      </div>
    );
  }

const handlePageChange = (newPage: number) => {
  console.log('handlePageChange called, newPage:', newPage);
  setPageIndex(newPage);
  setRowSelection({});
//  setSelectedRows([]);
};

async function handleDownloadAll(format: 'csv' | 'txt', visibleColumns: string[] | null) {
  if (!totalItems) {
    console.warn('No totalItems available for download');
    return;
  }

  try {
    const baseURL = `${DataAPI}/${resource}/?${cleanQ}`;
    // Request all items from server (use totalItems — you said this works)
    const res = await fetch(baseURL, {
      headers: {
        'Content-type': 'application/rqlquery+x-www-form-urlencoded',
        'Accept': 'application/json',
        'Range': `items=0-${totalItems}`, // you said totalItems works in your API
        'X-Range': `items=0-${totalItems}`,
      },
    });
    if (!res.ok) throw new Error(`Failed to fetch all data: ${res.status} ${res.statusText}`);
    const allData = await res.json();

    // Normalize response: if API wraps results, try to detect an items array, otherwise assume it's the array
    const rowsArray: any[] = Array.isArray(allData) ? allData : (allData.items ?? allData.response ?? allData.rows ?? []);

    // Determine which columns to export
    const colsToExport = (visibleColumns && visibleColumns.length > 0)
      ? visibleColumns
      : fields.map((c) => c.id);

    // Build header labels based on fields mapping (fall back to id)
    const headers = colsToExport.map((id) => {
      const col = fields.find((c) => c.id === id);
      return col?.label ?? id;
    });

    // CSV/TXT separator
    const separator = format === 'csv' ? ',' : '\t';

    // Helper to escape CSV values
    const escapeValue = (val: any) => {
      if (val === undefined || val === null) return '';
      if (typeof val === 'string') {
        // remove newlines and properly escape quotes for CSV
        const cleaned = val.replace(/\r\n|\n|\r/g, ' ');
        return `"${cleaned.replace(/"/g, '""')}"`;
      }
      if (typeof val === 'object') {
        const s = JSON.stringify(val);
        const cleaned = s.replace(/\r\n|\n|\r/g, ' ');
        return `"${cleaned.replace(/"/g, '""')}"`;
      }
      return String(val);
    };

    // Build content rows
    const contentRows = rowsArray.map((row) =>
      colsToExport
        .map((colId) => {
          const val = row[colId];
          // if CSV, use escapeValue; if TXT, use tab-separated without double-quoting complex objects
          if (format === 'csv') return escapeValue(val);
          // for txt (tab-separated), stringify objects but keep tabs/newlines replaced
          if (val === undefined || val === null) return '';
          if (typeof val === 'object') return JSON.stringify(val).replace(/\r\n|\n|\r/g, ' ');
          return String(val).replace(/\r\n|\n|\r/g, ' ');
        })
        .join(separator)
    );

    const content = [headers.join(separator), ...contentRows].join('\n');

    // download helper
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${resource}-all.${format}`;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error('Download all failed:', err);
    alert('Failed to download all results. See console for details.');
  }
}

  if (!stableColumns) {
    return <div>Loading...</div>;
  }

  const isLoading = metaLoading || dataLoading || !stableColumns;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden relative">
        <DataTable
//          id={widget.id}
          data={pageData ?? []}
          columns={memoColumns}
          rowSelection={rowSelection}
          onSelectionChange={(newSelection) => {
            setRowSelection(newSelection); // 👈 YOU WERE MISSING THIS
            onSelectionChange?.(newSelection);
            console.log('ListData: onSelectionChange called', newSelection);
          }}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          sorting={sorting}
          onSortingChange={setSortingAndResetPage}
          columnOrder={columnOrder}
          onColumnOrderChange={setColumnOrder}
          columnVisibility={memoVisibility ?? {}}
          onColumnVisibilityChange={setColumnVisibility}
          onDownloadAll={handleDownloadAll}
          isLoading={isLoading}
        />

        {(metaLoading || dataLoading || !fields.length || !columnVisibility) && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            Loading…
          </div>
        )}
      </div>
    </div>
  );

}

