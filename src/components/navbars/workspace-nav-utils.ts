import type { WorkspaceNavItem } from "@/components/navbars/navbar-links";
import {
  buildEncodedSegmentPath,
  encodeWorkspaceSegment,
  parsePathSegments,
} from "@/lib/services/workspace/path-utils";

export function resolveWorkspaceHref(
  item: WorkspaceNavItem,
  wsUsername: string,
  isAuthenticated: boolean,
): string {
  if (item.requiresAuth && !isAuthenticated) {
    return item.signInRedirect ?? "/sign-in?redirect=/workspace";
  }
  return typeof item.href === "function"
    ? item.href(encodeWorkspaceSegment(wsUsername))
    : item.href;
}

export function buildFolderHref(folderPath: string): string {
  return `/workspace/${buildEncodedSegmentPath(parsePathSegments(folderPath))}`;
}
