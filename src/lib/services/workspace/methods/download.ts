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

/**
 * Get one-time URL for downloading multiple workspace objects as an archive.
 * Calls Workspace.get_archive_url; returns [url, file_count, total_size].
 */
export async function getArchiveUrl(params: {
  objects: string[];
  recursive: boolean;
  archive_name: string;
  archive_type: string;
}): Promise<[string, number, number]> {
  return workspaceApi.makeRequest<[string, number, number]>(
    "Workspace.get_archive_url",
    [params],
  );
}
