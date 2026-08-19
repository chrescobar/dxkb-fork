export type WorkspaceViewMode = "home" | "shared" | "public";

export type SortField = "name" | "type" | "size" | "ownerId" | "createdAt";
export type SortDirection = "asc" | "desc";

export interface WorkspaceSortConfig {
  field: SortField;
  direction: SortDirection;
}
