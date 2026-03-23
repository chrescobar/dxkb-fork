export interface RecentFolder {
  path: string;
  visitedAt: number;
}

const storageKey = "dxkb-recent-workspace-folders";
const defaultMaxItems = 5;

/**
 * Extract the last segment of a workspace path for display.
 * e.g. "/user@bvbrc/home/Experiments" → "Experiments"
 */
export function getWorkspaceFolderDisplayName(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  const lastSlash = trimmed.lastIndexOf("/");
  return lastSlash === -1 ? trimmed : trimmed.slice(lastSlash + 1);
}

/**
 * Read recently visited folders from localStorage.
 * Optionally filter by a user prefix (e.g. "/user@bvbrc/") to avoid showing other users' entries.
 */
export function getRecentFolders(userPrefix?: string): RecentFolder[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentFolder[];
    if (!Array.isArray(parsed)) return [];
    const folders = parsed.filter(
      (f) => f && typeof f.path === "string" && typeof f.visitedAt === "number",
    );
    if (!userPrefix) return folders;
    const prefix = userPrefix.startsWith("/") ? userPrefix : `/${userPrefix}`;
    return folders.filter((f) => f.path.startsWith(`${prefix}/`));
  } catch {
    return [];
  }
}

/**
 * Add a folder to the recently visited list. Deduplicates and trims to maxItems.
 */
export function addRecentFolder(
  path: string,
  maxItems: number = defaultMaxItems,
): void {
  try {
    const existing = getRecentFolders();
    const filtered = existing.filter((f) => f.path !== path);
    const updated = [{ path, visitedAt: Date.now() }, ...filtered].slice(
      0,
      maxItems,
    );
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

/**
 * Clear all recently visited folders.
 */
export function clearRecentFolders(): void {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // localStorage unavailable — silently ignore
  }
}
