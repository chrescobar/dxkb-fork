"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { JobListItem, JobStatus } from "@/types/workspace";
import { formatDate } from "@/lib/services/workspace/helpers";
import { statusConfig } from "@/lib/jobs/constants";
import { formatServiceName, getOutputName } from "@/lib/jobs/formatting";
import type { DataTableSort } from "@/components/shared/file-table";

function StatusCell({ status }: { status: JobStatus }) {
  const config = statusConfig[status] ?? statusConfig.pending;
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`size-3.5 shrink-0 ${config.className}`} />
      <span className="truncate text-xs text-muted-foreground">
        {config.label}
      </span>
    </div>
  );
}

export function useJobsColumns(
  sort: DataTableSort,
  onSortChange: (sort: DataTableSort) => void,
) {
  const handleSort = (field: string) => {
    if (sort.field === field) {
      onSortChange({
        field,
        direction: sort.direction === "asc" ? "desc" : "asc",
      });
    } else {
      onSortChange({ field, direction: "asc" });
    }
  };

  const columns: ColumnDef<JobListItem>[] = [
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusCell status={row.original.status} />,
      meta: { className: "", sortField: "status" },
      size: 100,
      enableResizing: true,
    },
    {
      id: "id",
      accessorKey: "id",
      header: "ID",
      cell: ({ getValue }) => (
        <span
          className="block truncate font-mono text-xs text-muted-foreground"
          title={String(getValue())}
        >
          {String(getValue())}
        </span>
      ),
      meta: { className: "" },
      size: 70,
      enableResizing: true,
    },
    {
      id: "app",
      accessorKey: "app",
      header: "Service",
      cell: ({ getValue }) => (
        <span
          className="block truncate font-medium"
          title={(getValue() as string | undefined) ?? ""}
        >
          {formatServiceName((getValue() as string | undefined) ?? "")}
        </span>
      ),
      meta: { className: "", sortField: "app" },
      size: 160,
      enableResizing: true,
    },
    {
      id: "output_name",
      header: "Output Name",
      cell: ({ row }) => (
        <span
          className="block truncate text-muted-foreground"
          title={getOutputName(row.original)}
        >
          {getOutputName(row.original)}
        </span>
      ),
      meta: { className: "" },
      size: 180,
      enableResizing: true,
    },
    {
      id: "submit_time",
      accessorKey: "submit_time",
      header: "Submit",
      cell: ({ getValue }) => (
        <span className="block truncate text-muted-foreground">
          {formatDate((getValue() as string | undefined) ?? "")}
        </span>
      ),
      meta: { className: "", sortField: "submit_time" },
      size: 120,
      enableResizing: true,
    },
    {
      id: "start_time",
      accessorKey: "start_time",
      header: "Start",
      cell: ({ getValue }) => (
        <span className="block truncate text-muted-foreground">
          {getValue() ? formatDate(String(getValue())) : "\u2014"}
        </span>
      ),
      meta: { className: "", sortField: "start_time" },
      size: 120,
      enableResizing: true,
    },
    {
      id: "completed_time",
      accessorKey: "completed_time",
      header: "Completed",
      cell: ({ getValue }) => (
        <span className="block truncate text-muted-foreground">
          {getValue() ? formatDate(String(getValue())) : "\u2014"}
        </span>
      ),
      meta: {
        className: "",
        sortField: "completed_time",
      },
      size: 120,
      enableResizing: true,
    },
  ];

  return { columns, handleSort };
}
