"use client";

import { useState } from "react";
import {
  ResourceCollection,
  type ResourceCollectionProfile,
} from "@/components/views";
import { DataRepository, type DataResource } from "@/lib/data-api";
import type { CollectionState } from "@/lib/views/collection-state";

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
      ? input.map((item) => String(item)).join("; ")
      : typeof input === "string" ||
          typeof input === "number" ||
          typeof input === "boolean" ||
          typeof input === "bigint"
        ? String(input)
        : input == null
          ? ""
          : JSON.stringify(input);
    return format === "csv"
      ? `"${text.replaceAll("\"", "\"\"")}"`
      : text.replaceAll("\t", " ");
  };
  const body = [
    fields.join(separator),
    ...rows.map((row) =>
      fields.map((field) => value(row[field])).join(separator),
    ),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([body]));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${name}.${format}`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function GenomeChildCollection({
  resource,
  label,
  idField,
  rql,
  columns,
  defaultSort,
}: {
  resource: DataResource;
  label: string;
  idField: string;
  rql: string;
  columns: ResourceCollectionProfile<ChildRow>["columns"];
  defaultSort: string;
}) {
  const [state, setState] = useState<CollectionState>({
    filters: {},
    page: 1,
    sort: defaultSort,
  });
  const profile: ResourceCollectionProfile<ChildRow> = {
    resource,
    label,
    idField,
    columns,
    defaultSort,
    basePredicate: rql,
  };
  return (
    <ResourceCollection
      profile={profile}
      repository={repository}
      state={state}
      onStateChange={setState}
      onExport={async ({ format, selectedIds, fields }) => {
        const selectedFields = fields
          ? [...fields]
          : columns.map((column) => column.id);
        const result = selectedIds?.length
          ? await repository.selected(resource, {
              ids: [...selectedIds],
              fields: selectedFields,
            })
          : await repository.exportAll(resource, {
              rql,
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
