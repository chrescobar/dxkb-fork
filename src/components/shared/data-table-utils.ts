export function computeShiftRangeIds(
  rows: { id: string }[],
  anchorId: string,
  targetId: string,
): string[] {
  const anchorIdx = rows.findIndex((row) => row.id === anchorId);
  const targetIdx = rows.findIndex((row) => row.id === targetId);
  if (anchorIdx === -1 || targetIdx === -1) return [];

  const from = Math.min(anchorIdx, targetIdx);
  const to = Math.max(anchorIdx, targetIdx);
  const ids: string[] = [];
  for (let index = from; index <= to; index++) ids.push(rows[index].id);
  return ids;
}

export function formatCellValue(value: unknown): unknown {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value);
    return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getFullYear())}`;
  }
  if (Array.isArray(value)) return value.join(", ");
  return value;
}

export function estimateHeaderWidth(label: string): number {
  const longestWord = label
    .split(/\s+/)
    .reduce((a, b) => (a.length >= b.length ? a : b), "");
  return Math.min(Math.max(longestWord.length * 7 + 32, 60), 250);
}
