"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { FacetColumn } from "./facet-column";
import { SelectedFilter } from "@/types/filters";

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
  selected: SelectedFilter[];
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
  selected,
}: FacetPanelProps) {
  const [facets, setFacets] = useState<Partial<Record<string, FacetItem[]>>>({});
  const [fetchError, setFetchError] = useState<string | null>(null);
  const DataAPI = process.env.NEXT_PUBLIC_DATA_API;
  const requestId = useRef(0);

  const visibleFacets = useMemo(() => {
    return fields
      .filter(f => f.facet && !f.facet_hidden)
      .map(f => f.id);
  }, [fields]);

  useEffect(() => {
    if (!DataAPI) return;
    if (!resource) return;
    if (fields.length === 0) {
      return;
    }

    const fetchFacets = async () => {
      const currentRequest = ++requestId.current;
      setFetchError(null);

      try {

        // ---------------------------------------------------
        // EXTRACT VALID FIELDS
        // ---------------------------------------------------
        const validFields = fields
          .filter((f): f is ColumnField =>
            typeof f.id === "string" &&
            f.id.trim().length > 0
          )
          .map(f => f.id);
          
        if (validFields.length === 0) {
          console.warn("FacetPanel: no valid facet fields", fields);
          return;
        }

        // ---------------------------------------------------
        // BUILD FACET STRING 
        // ---------------------------------------------------
        const facetFieldsStr = validFields.join(",");

        if (!facetFieldsStr) {
          console.warn("FacetPanel: facetFieldsStr empty");
          return;
        }

        const facetStr = `facet(${facetFieldsStr},(mincount,1),(limit,100))`;
        const filterStr = selected
          .map(f => `eq(${f.field},${String(f.value)})`)
          .join(",");
          
        const RQLstring = [
          query || "",
          filterStr,
          "limit(1)",
          facetStr
        ]
          .filter(Boolean)
          .join("&");

        const url = `${DataAPI}/${resource}/?${RQLstring}`;
        // ---------------------------------------------------
        // FETCH
        // ---------------------------------------------------
        const res = await fetch(url, {
          headers: {
            "Accept": "application/solr+json",
          },
        });

        if (!res.ok) {
          const text = await res.text();
          console.warn("Facet fetch failed:", text);
          if (currentRequest === requestId.current) {
            setFetchError("Facets unavailable");
          }
          return;
        }

        const json = await res.json() as { facet_counts?: { facet_fields?: Record<string, (string | number)[]> } } | null | undefined;

        // ---------------------------------------------------
        // PARSE RESPONSE
        // ---------------------------------------------------
 // 🚨 ignore stale responses
        if (currentRequest !== requestId.current) return;

        const parsed = parseFacetCounts(
          json?.facet_counts?.facet_fields ?? {}
        );

        setFacets(parsed);
      } catch (err) {
        console.warn("Facet fetch error:", err);
        if (currentRequest === requestId.current) {
          setFetchError("Facets unavailable");
        }
      }
    };

    void fetchFacets();
  }, [fields, query, resource, DataAPI, selected]);

  if (fetchError) {
    return (
      <div className="flex max-h-30 items-center rounded bg-gray-800 p-2 text-[11px] text-gray-400">
        {fetchError}
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
          items={facets[field.id] ?? []}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}