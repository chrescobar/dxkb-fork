"use client";

import { useState } from "react";
import { DataRepository, type DataResource } from "@/lib/data-api";
import { featureCollectionProfile, type FeatureViewRecord } from "@/lib/feature-view";
import type { CollectionState } from "@/lib/views/collection-state";
import { ResourceCollection, type ResourceCollectionProfile } from "./resource-collection";

const repository = new DataRepository();
type ChildRow = Record<string, unknown>;

function saveRows(
  rows: readonly ChildRow[],
  fields: readonly string[],
  format: "csv" | "txt",
  name: string,
) {
  const separator = format === "csv" ? "," : "\t";
  const value = (input: unknown) => {
    const text = Array.isArray(input)
      ? input.map(String).join("; ")
      : typeof input === "string" || typeof input === "number" || typeof input === "boolean" || typeof input === "bigint"
        ? String(input)
        : input == null ? "" : JSON.stringify(input);
    const cleaned = text.replace(/\r\n|\n|\r/g, " ");
    if (format === "txt") return cleaned.replaceAll("\t", " ");
    const safe = /^[=+\-@]/.test(cleaned) ? `'${cleaned}` : cleaned;
    return `"${safe.replaceAll("\"", "\"\"")}"`;
  };
  const body = [fields.join(separator), ...rows.map((row) => fields.map((field) => value(row[field])).join(separator))].join("\n");
  const url = URL.createObjectURL(new Blob([body]));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${name}.${format}`;
  anchor.click();
  URL.revokeObjectURL(url);
}

interface ResourceChildCollectionProps {
  resource: DataResource;
  label: string;
  idField: string;
  rql: string;
  columns: ResourceCollectionProfile<ChildRow>["columns"];
  defaultSort: string;
}

export function ResourceChildCollection({
  resource,
  label,
  idField,
  rql,
  columns,
  defaultSort,
}: ResourceChildCollectionProps) {
  const [state, setState] = useState<CollectionState>({ filters: {}, page: 1, sort: defaultSort });
  const profile: ResourceCollectionProfile<ChildRow> = resource === "genome_feature"
    ? {
        ...featureCollectionProfile,
        label,
        basePredicate: rql,
        rowHref: (row) => featureCollectionProfile.rowHref?.(row as FeatureViewRecord),
      }
    : { resource, label, idField, columns, defaultSort, basePredicate: rql };

  return (
    <ResourceCollection
      profile={profile}
      repository={repository}
      state={state}
      onStateChange={setState}
      showHeader={false}
      onExport={async ({ format, selectedIds, fields, rql: exportRql }) => {
        const selectedFields = fields ? [...fields] : columns.map((column) => column.id);
        const result = selectedIds?.length
          ? await repository.selected(resource, { ids: [...selectedIds], fields: selectedFields })
          : await repository.exportAll(resource, {
              rql: exportRql ?? rql,
              keyword: state.keyword,
              fields: selectedFields,
              sort: {
                field: state.sort.split(":")[0],
                direction: state.sort.endsWith(":desc") ? "desc" : "asc",
              },
            });
        saveRows(result.rows, selectedFields, format, label.toLowerCase());
      }}
    />
  );
}
