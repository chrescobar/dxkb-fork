export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-10 md:px-6">
      <div className="flex flex-col space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded bg-muted" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
                <div className="mb-4 h-5 w-24 animate-pulse rounded bg-muted" />
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-3 w-32 animate-pulse rounded bg-muted" />
              </div>
            ))}
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="space-y-4 p-6">
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="h-[200px] w-full animate-pulse rounded bg-muted" />
          </div>
        </div>

        <div className="space-y-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="flex gap-2">
                    <div className="h-8 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-8 w-32 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

