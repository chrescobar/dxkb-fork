/**
 * Response parsers for Workspace API methods. Extracted from the previous
 * in-client dispatcher so each method's parse behavior is independently
 * testable.
 */

import type { WorkspaceItem } from "../domain";

/**
 * Convert a raw ls tuple array (as returned by Workspace.ls) into an untyped
 * record. Moved here from helpers.ts so both `parsers.ts` and `client.ts` can
 * share this without a circular import.
 */
export function parseTupleToRawObject(list: unknown[]): Record<string, unknown> {
  const name = list[0];
  const parent = String(list[2] ?? "");
  const nameStr = String(name ?? "");
  return {
    id: list[4],
    path: parent + nameStr,
    name,
    type: list[1],
    creation_time: list[3],
    link_reference: list[11],
    owner_id: list[5],
    size: Number(list[6]) || 0,
    userMeta: list[7],
    autoMeta: list[8],
    user_permission: list[9],
    global_permission: list[10],
    timestamp: Date.parse(String(list[3])),
  };
}

/** Convert a raw ls tuple directly to a canonical `WorkspaceItem`. */
function parseTupleToWorkspaceItem(tuple: unknown[]): WorkspaceItem {
  const name = String(tuple[0] ?? "");
  const parent = String(tuple[2] ?? "");
  const createdAt = tuple[3] ? String(tuple[3]) : undefined;
  return {
    id: String(tuple[4] ?? ""),
    name,
    path: parent + name,
    type: String(tuple[1] ?? ""),
    size: Number(tuple[6]) || 0,
    ownerId: tuple[5] ? String(tuple[5]) : undefined,
    createdAt,
    timestamp: createdAt ? Date.parse(createdAt) : undefined,
    permissions: {
      user: tuple[9] ? String(tuple[9]) : undefined,
      global: tuple[10] ? String(tuple[10]) : undefined,
    },
    userMeta: (tuple[7] as Record<string, unknown>) ?? undefined,
    autoMeta: (tuple[8] as Record<string, unknown>) ?? undefined,
    linkReference: tuple[11] ? String(tuple[11]) : undefined,
  };
}

/**
 * Parse a `Workspace.ls` result. Raw shape: result[0] is a map from requested
 * path -> list of object tuples. Only the listing for `requestedPath` is
 * returned. Unmatched / missing entries yield an empty array.
 */
export function parseLsResult(
  rawResult: unknown,
  requestedPath: string,
): WorkspaceItem[] {
  if (!Array.isArray(rawResult) || rawResult.length === 0) return [];
  const pathsMap = rawResult[0];
  if (!pathsMap || typeof pathsMap !== "object") return [];
  const entries = (pathsMap as Record<string, unknown>)[requestedPath];
  if (!Array.isArray(entries)) return [];
  return entries.map((tuple) => parseTupleToWorkspaceItem(tuple as unknown[]));
}

/**
 * Same as `parseLsResult` but returns the first available path's listing when
 * the exact requested path isn't found. Mirrors the fallback behavior of the
 * old `WorkspaceApiClient.makeRequest`.
 */
export function parseLsResultLoose(rawResult: unknown): WorkspaceItem[] {
  if (!Array.isArray(rawResult) || rawResult.length === 0) return [];
  const pathsMap = rawResult[0];
  if (!pathsMap || typeof pathsMap !== "object") return [];
  const keys = Object.keys(pathsMap as Record<string, unknown>);
  const first = keys[0];
  if (!first) return [];
  const entries = (pathsMap as Record<string, unknown>)[first];
  if (!Array.isArray(entries)) return [];
  return entries.map((tuple) => parseTupleToWorkspaceItem(tuple as unknown[]));
}

/**
 * Parse `Workspace.list_permissions` into the canonical path -> entries map.
 * Result shape: result[0] is already the map; unwrap it.
 */
export function parseListPermissions(
  rawResult: unknown,
): Record<string, [string, string][]> {
  if (!Array.isArray(rawResult) || rawResult.length === 0) return {};
  const map = rawResult[0];
  if (!map || typeof map !== "object") return {};
  return map as Record<string, [string, string][]>;
}

/**
 * Parse a Shock-upload-node `Workspace.create` result. Returns the
 * `link_reference` string from the tuple at [0][0][11].
 */
export function parseUploadNode(rawResult: unknown): string | null {
  if (!Array.isArray(rawResult) || rawResult.length === 0) return null;
  const outer = rawResult[0];
  if (!Array.isArray(outer) || outer.length === 0) return null;
  const tuple = outer[0];
  if (!Array.isArray(tuple)) return null;
  const link = tuple[11];
  return typeof link === "string" ? link : null;
}

/**
 * Parse a `Workspace.du` response. Raw shape: result[0] = [[path, size, fileCount, dirCount, error], ...].
 */
export function parseDuResult(
  rawResult: unknown,
): [string, number, number, number, string][] {
  if (!Array.isArray(rawResult) || rawResult.length === 0) return [];
  const inner = rawResult[0];
  if (!Array.isArray(inner)) return [];
  return inner as [string, number, number, number, string][];
}
