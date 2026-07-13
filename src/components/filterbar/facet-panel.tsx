"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FacetColumn } from "./facet-column";
import { Skeleton } from "@/components/ui/skeleton";

interface FacetItem {
  label: string;
  value: string;
  count: number;
};

interface ColumnField {
  id: string;
  label: string;
  facet?: boolean;
  facet_hidden?: boolean;
};

interface FacetPanelProps {
  fields: ColumnField[];
  query: string;
  resource: string;
  onSelect: (field: string, value: string) => void;
};

// ------------------------------
// Parse Solr facet response
// ------------------------------
function parseFacetCounts(
  facets: Record<string, (string | number)[]>
): Record<string, FacetItem[]> {
  const out: Record<string, FacetItem[]> = {};

  Object.keys(facets).forEach((cat) => {
    const data = facets[cat];
    out[cat] = [];

    for (let i = 0; i < data.length - 1; i += 2) {
      const label = String(data[i]);
      out[cat].push({
        label,
        value: label,
        count: Number(data[i + 1]),
      });
    }
  });

  return out;
}

export function FacetPanel({
  fields,
  query,
  resource,
  onSelect,
}: FacetPanelProps) {
  const DataAPI = process.env.NEXT_PUBLIC_DATA_API;

  const visibleFacets = useMemo(
    () => fields.filter(f => f.facet && !f.facet_hidden).map(f => f.id),
    [fields],
  );

  const validFieldIds = useMemo(
    () => fields.map(f => f.id).filter(id => typeof id === "string" && id.trim().length > 0),
    [fields],
  );

  const { data: facets, error, isLoading } = useQuery({
    queryKey: ["facets", resource, query, validFieldIds],
    queryFn: async ({ signal }) => {
      const facetStr = `facet(${validFieldIds.join(",")},( mincount,1),(limit,100))`;
      const rql = [query || "", "limit(1)", facetStr].filter(Boolean).join("&");
      const res = await fetch(`${DataAPI}/${resource}/?${rql}`, {
        signal,
        headers: { Accept: "application/solr+json" },
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json() as { facet_counts?: { facet_fields?: Record<string, (string | number)[]> } };
      return parseFacetCounts(json?.facet_counts?.facet_fields ?? {});
    },
    enabled: !!DataAPI && !!resource && validFieldIds.length > 0,
    // Keep previous data visible during background refetch — no flash or spinner
    placeholderData: prev => prev,
    staleTime: 30_000,
  });

  if (error && !facets) {
    return (
      <div className="flex max-h-30 items-center rounded bg-gray-800 p-2 text-[11px] text-gray-400">
        Facets unavailable
      </div>
    );
  }

  if (isLoading && !facets) {
    return (
      <div className="flex max-h-30 gap-3 overflow-auto rounded bg-gray-800 p-2 text-[11px]">
        {fields.filter(f => visibleFacets.includes(f.id)).map((field) => (
          <div key={field.id} className="shrink-0">
            <Skeleton className="mb-2 h-3 w-24 bg-gray-600" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3.5 w-32 bg-gray-700" />
              <Skeleton className="h-3.5 w-24 bg-gray-700" />
              <Skeleton className="h-3.5 w-28 bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex max-h-30 gap-3 overflow-auto rounded bg-gray-800 p-2 text-[11px]">
      {fields
        .filter(f => visibleFacets.includes(f.id))
        .map((field) => (
          <FacetColumn
            key={field.id}
            field={field}
            items={facets?.[field.id] ?? []}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}