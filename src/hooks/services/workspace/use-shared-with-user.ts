"use client";

import { useQuery } from "@tanstack/react-query";
import type { WorkspaceItem } from "@/lib/services/workspace/domain";
import { useWorkspaceRepository } from "@/contexts/workspace-repository-context";
import { workspaceQueryKeys } from "@/lib/services/workspace/workspace-query-keys";

interface UseSharedWithUserOptions {
  username: string;
  enabled?: boolean;
  initialData?: WorkspaceItem[];
}

export function useSharedWithUser({
  username,
  enabled = true,
  initialData,
}: UseSharedWithUserOptions) {
  const repository = useWorkspaceRepository("authenticated");

  return useQuery<WorkspaceItem[]>({
    queryKey: workspaceQueryKeys.sharedRoot(username),
    queryFn: async () => {
      const items = await repository.listDirectory({ path: "/" });
      return items.filter((item) => {
        const globalPermission = item.permissions?.global ?? "";
        const userPermission = item.permissions?.user ?? "";
        if (globalPermission !== "n") return false;
        if (userPermission === "o" && globalPermission === "n") return false;
        return true;
      });
    },
    enabled: enabled && !!username,
    initialData,
    staleTime: 2 * 60 * 1000,
  });
}

interface UseUserWorkspacesOptions {
  username: string;
  enabled?: boolean;
  initialData?: WorkspaceItem[];
}

export function useUserWorkspaces({
  username,
  enabled = true,
  initialData,
}: UseUserWorkspacesOptions) {
  const repository = useWorkspaceRepository("authenticated");

  return useQuery<WorkspaceItem[]>({
    queryKey: workspaceQueryKeys.userRoot(username),
    queryFn: async () => {
      const decoded = decodeURIComponent(username);
      const userSegment = decoded.includes("@")
        ? decoded
        : `${decoded}@bvbrc`;
      return repository.listDirectory({ path: `/${userSegment}` });
    },
    enabled: enabled && !!username,
    initialData,
    staleTime: 2 * 60 * 1000,
  });
}
