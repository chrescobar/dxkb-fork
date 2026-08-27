import type { DataTableColumn } from "@/components/shared/data-table";

function exportValue(value: unknown, format: "csv" | "txt"): string {
  if (value == null) return "";
  let serialized: string;
  if (Array.isArray(value)) serialized = value.map(String).join("; ");
  else if (typeof value === "object") serialized = JSON.stringify(value);
  else if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint" ||
    typeof value === "symbol"
  )
    serialized = String(value);
  else serialized = "";
  const cleaned = serialized.replace(/\r\n|\n|\r/g, " ");
  return format === "csv"
    ? `"${cleaned.replaceAll('"', '""')}"`
    : cleaned.replaceAll("\t", " ");
}

export function downloadResourceExport(
  resource: string,
  rows: readonly Record<string, unknown>[],
  columns: readonly DataTableColumn[],
  fields: readonly string[],
  format: "csv" | "txt",
) {
  const separator = format === "csv" ? "," : "\t";
  const headers = fields.map(
    (field) => columns.find((column) => column.id === field)?.label ?? field,
  );
  const content = [
    headers.join(separator),
    ...rows.map((row) =>
      fields.map((field) => exportValue(row[field], format)).join(separator),
    ),
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/plain;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${resource}.${format}`;
  anchor.click();
  URL.revokeObjectURL(url);
}
