import type { WorkspaceDirectoryMode } from "@/hooks/services/workspace/use-workspace-directory";
import type { WorkspaceViewMode } from "@/types/workspace-browser";

type PublicWorkspaceLevel = "root" | "user" | "path";

export function pickDirectoryMode(options: {
  mode: WorkspaceViewMode;
  username: string;
  path: string;
  fullPath: string;
  currentUser: string;
  isJobResultView: boolean;
  isAtSharedRoot: boolean;
  isPublic: boolean;
  publicLevel: PublicWorkspaceLevel;
  jobDotPath?: string;
}): WorkspaceDirectoryMode | null {
  const {
    mode,
    username,
    path,
    fullPath,
    currentUser,
    isJobResultView,
    isAtSharedRoot,
    isPublic,
    publicLevel,
    jobDotPath,
  } = options;

  if (isJobResultView) {
    if (!jobDotPath) return null;
    return {
      kind: "jobResult",
      fullPath: jobDotPath.startsWith("/") ? jobDotPath : `/${jobDotPath}`,
      visiblePath: path,
    };
  }
  if (isPublic) {
    if (publicLevel === "root" || !username) return { kind: "publicRoot" };
    if (publicLevel === "user") return { kind: "publicUser", username };
    return { kind: "publicPath", fullPath };
  }
  if (mode === "home") {
    if (!currentUser) return null;
    return { kind: "home", username, path };
  }
  if (isAtSharedRoot) {
    if (!currentUser) return null;
    return { kind: "sharedRoot", currentUser };
  }
  if (!fullPath) return null;
  return { kind: "sharedPath", fullPath };
}
