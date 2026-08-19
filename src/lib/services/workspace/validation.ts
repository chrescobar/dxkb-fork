/**
 * Check if a workspace object exists at the given path using Workspace.get.
 * - 200 response: object exists (name is taken).
 * - Non-200 (e.g. 500): object does not exist (name is available).
 * - Network failures reject so callers can distinguish them from missing paths.
 */
export async function checkWorkspaceObjectExists(
  fullPath: string,
  options?: { signal?: AbortSignal },
): Promise<boolean> {
  if (!fullPath.trim()) {
    return false;
  }

  const response = await fetch("/api/services/workspace", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      method: "Workspace.get",
      params: [
        {
          objects: [fullPath],
          metadata_only: true,
        },
      ],
    }),
    signal: options?.signal,
  });

  return response.ok;
}
