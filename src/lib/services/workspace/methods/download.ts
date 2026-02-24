import { workspaceApi } from "@/lib/services/workspace/client";

/**
 * Get one-time download URLs for workspace objects.
 * Calls Workspace.get_download_url; returns array of URL arrays, one per requested path.
 */
export async function getDownloadUrls(objectPaths: string[]): Promise<string[][]> {
  if (objectPaths.length === 0) return [];
  return workspaceApi.makeRequest<string[][]>("Workspace.get_download_url", [
    { objects: objectPaths },
  ]);
}
