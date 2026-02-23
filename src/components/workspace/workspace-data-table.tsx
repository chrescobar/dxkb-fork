"use client";

import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, ArrowUpDown, FolderUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceItemIcon, isFolderType } from "./workspace-item-icon";
import {
  WorkspaceBrowserItem,
  SortField,
  WorkspaceBrowserSort,
} from "@/types/workspace-browser";

interface WorkspaceDataTableProps {
  items: WorkspaceBrowserItem[];
  isLoading: boolean;
  path: string;
  sort: WorkspaceBrowserSort;
  onSortChange: (sort: WorkspaceBrowserSort) => void;
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatOwner(ownerId: string): string {
  if (!ownerId) return "";
  return ownerId.replace(/@bvbrc$/, "");
}

function SortIcon({
  field,
  currentSort,
}: {
  field: SortField;
  currentSort: WorkspaceBrowserSort;
}) {
  if (currentSort.field !== field) {
    return <ArrowUpDown className="text-muted-foreground/50 ml-1 inline h-3 w-3" />;
  }
  return currentSort.direction === "asc" ? (
    <ArrowUp className="ml-1 inline h-3 w-3" />
  ) : (
    <ArrowDown className="ml-1 inline h-3 w-3" />
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-40" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function WorkspaceDataTable({
  items,
  isLoading,
  path,
  sort,
  onSortChange,
}: WorkspaceDataTableProps) {
  const router = useRouter();
  const isAtRoot = !path || path === "" || path === "/";

  function handleSort(field: SortField) {
    if (sort.field === field) {
      onSortChange({
        field,
        direction: sort.direction === "asc" ? "desc" : "asc",
      });
    } else {
      onSortChange({ field, direction: "asc" });
    }
  }

  function handleItemClick(item: WorkspaceBrowserItem) {
    if (isFolderType(item.type)) {
      const segments = path ? path.split("/").filter(Boolean) : [];
      segments.push(item.name);
      const newPath = segments.map(encodeURIComponent).join("/");
      router.push(`/workspace/home/${newPath}`);
    }
  }

  function handleParentClick() {
    const segments = path.split("/").filter(Boolean);
    segments.pop();
    const parentPath = segments.map(encodeURIComponent).join("/");
    router.push(`/workspace/home${parentPath ? `/${parentPath}` : ""}`);
  }

  const sortableColumns: { field: SortField; label: string; className?: string }[] = [
    { field: "name", label: "Name" },
    { field: "size", label: "Size" },
    { field: "owner_id", label: "Owner", className: "hidden md:table-cell" },
    { field: "creation_time", label: "Created", className: "hidden sm:table-cell" },
  ];

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {sortableColumns.map((col) => (
              <TableHead
                key={col.field}
                className={`cursor-pointer select-none ${col.className ?? ""}`}
                onClick={() => handleSort(col.field)}
              >
                {col.label}
                <SortIcon field={col.field} currentSort={sort} />
              </TableHead>
            ))}
            <TableHead className="hidden lg:table-cell">Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <>
              {!isAtRoot && (
                <TableRow
                  className="cursor-pointer"
                  onClick={handleParentClick}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FolderUp className="h-4 w-4 shrink-0 text-amber-500" />
                      <span className="text-muted-foreground font-medium italic">
                        Parent Folder
                      </span>
                    </div>
                  </TableCell>
                  <TableCell />
                  <TableCell className="hidden md:table-cell" />
                  <TableCell className="hidden sm:table-cell" />
                  <TableCell className="hidden lg:table-cell" />
                </TableRow>
              )}

              {items.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-12 text-center">
                    This folder is empty
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const isNavigable = isFolderType(item.type);

                  return (
                    <TableRow
                      key={item.id}
                      className={isNavigable ? "cursor-pointer" : ""}
                      onClick={() => isNavigable && handleItemClick(item)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <WorkspaceItemIcon type={item.type} />
                          <span
                            className={
                              isNavigable
                                ? "font-medium hover:underline"
                                : ""
                            }
                          >
                            {item.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatFileSize(item.size)}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">
                        {formatOwner(item.owner_id)}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden sm:table-cell">
                        {formatDate(item.creation_time)}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden lg:table-cell">
                        {item.type}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
