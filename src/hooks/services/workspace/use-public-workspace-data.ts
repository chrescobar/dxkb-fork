"use client";

import { useQuery } from "@tanstack/react-query";
import {
  listPublicWorkspaces,
  listUserPublicWorkspaces,
  listPublicWorkspacePath,
} from "@/lib/services/workspace/public-client";
import type { WorkspaceBrowserItem } from "@/types/workspace-browser";

export type PublicWorkspaceLevel = "root" | "user" | "path";

export interface UsePublicWorkspaceDataOptions {
  level: PublicWorkspaceLevel;
  username?: string;
  fullPath?: string;
}

export interface UsePublicWorkspaceDataReturn {
  items: WorkspaceBrowserItem[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePublicWorkspaceData({
  level,
  username,
  fullPath,
}: UsePublicWorkspaceDataOptions): UsePublicWorkspaceDataReturn {
  const rootQuery = useQuery<WorkspaceBrowserItem[], Error>({
    queryKey: ["workspace-public-root"],
    queryFn: listPublicWorkspaces,
    enabled: level === "root",
    staleTime: 2 * 60 * 1000,
  });

  const userQuery = useQuery<WorkspaceBrowserItem[], Error>({
    queryKey: ["workspace-public-user", username],
    queryFn: () => listUserPublicWorkspaces(username ?? ""),
    enabled: level === "user" && !!username,
    staleTime: 2 * 60 * 1000,
  });

  const pathQuery = useQuery<WorkspaceBrowserItem[], Error>({
    queryKey: ["workspace-public-path", fullPath],
    queryFn: () => listPublicWorkspacePath(fullPath ?? ""),
    enabled: level === "path" && !!fullPath,
    staleTime: 2 * 60 * 1000,
  });

  const activeQuery =
    level === "root" ? rootQuery : level === "user" ? userQuery : pathQuery;

  return {
    items: activeQuery.data ?? [],
    isLoading: activeQuery.isLoading,
    isFetching: activeQuery.isFetching,
    error: activeQuery.error,
    refetch: activeQuery.refetch,
  };
}
