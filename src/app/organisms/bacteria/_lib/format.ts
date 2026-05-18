export function formatCount(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e4) return n.toLocaleString();
  return n.toLocaleString();
}

export function formatCountFull(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString();
}
