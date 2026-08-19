interface PlaceholderListProps {
  label: string;
  rql: string;
}

/** Skeleton-stage stand-in for a real data grid. Replaced per-type in the data phase. */
export function PlaceholderList({ label, rql }: PlaceholderListProps) {
  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <h2 className="text-lg font-semibold">{label} list</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Results grid coming soon. Active filter:{" "}
        {rql ? <code className="font-mono">{rql}</code> : <span>all records</span>}
      </p>
    </div>
  );
}
