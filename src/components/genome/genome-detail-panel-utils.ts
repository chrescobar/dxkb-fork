export function detailPanelQueryKey(resource: string, id: string) {
  return ["selected-row", resource, id] as const;
}

export function firstRowFromApiShape(
  data:
    unknown[] | { items?: unknown[]; response?: { docs?: unknown[] } } | null,
): Record<string, unknown> | null {
  if (data === null) return null;
  const row: unknown = Array.isArray(data)
    ? data[0]
    : (data.items?.[0] ?? data.response?.docs?.[0]);
  return (row ?? null) as Record<string, unknown> | null;
}
