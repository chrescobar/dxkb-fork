"use client";

import { useQuery } from "@tanstack/react-query";
import { WorkspaceBrowserItem } from "@/types/workspace-browser";
import { WorkspaceApiClient } from "@/lib/services/workspace/client";

const client = new WorkspaceApiClient();

function buildWorkspacePath(username: string, relativePath: string): string {
  const trimmed = relativePath.replace(/^\/+|\/+$/g, "");
  const base = `/${username}@bvbrc/home`;
  return trimmed ? `${base}/${trimmed}` : base;
}

async function fetchDirectoryContents(
  username: string,
  relativePath: string,
): Promise<WorkspaceBrowserItem[]> {
  const fullPath = buildWorkspacePath(username, relativePath);

  const results = await client.makeRequest<WorkspaceBrowserItem[]>(
    "Workspace.ls",
    [{ paths: [fullPath], includeSubDirs: false, recursive: false }],
  );

  return results;
}

interface UseWorkspaceBrowserOptions {
  username: string;
  path: string;
  enabled?: boolean;
}

export function useWorkspaceBrowser({
  username,
  path,
  enabled = true,
}: UseWorkspaceBrowserOptions) {
  return useQuery<WorkspaceBrowserItem[], Error>({
    queryKey: ["workspace-browser", username, path],
    queryFn: () => fetchDirectoryContents(username, path),
    enabled: enabled && !!username,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
