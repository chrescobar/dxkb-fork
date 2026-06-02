import { workspaceApi } from "./client";

/** Raw Workspace.get result (nested arrays of object metadata). */
export type WorkspaceGetResult = unknown[];

/**
 * Fetch workspace object metadata (e.g. when opening a shared folder).
 * Uses Workspace.get with metadata_only: true.
 * Paths are decoded so @ is sent literally (not %40) to the API.
 */
export async function getWorkspaceMetadata(
  objectPaths: string[],
  options?: { silent?: boolean },
): Promise<WorkspaceGetResult> {
  if (objectPaths.length === 0) return [];
  const decodedPaths = objectPaths.map((p) => decodeURIComponent(p));
  return workspaceApi.makeRequest<WorkspaceGetResult>("Workspace.get", [
    { objects: decodedPaths, metadata_only: true },
  ], options);
}
