export default function Loading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 md:px-6">
      <div className="flex flex-col gap-8">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded bg-muted" />
        </div>

        {Array(3)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
              <div className="space-y-4">
                <div className="h-6 w-48 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
