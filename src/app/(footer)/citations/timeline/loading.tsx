export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-10 md:px-6">
      <div className="flex flex-col space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded bg-muted" />
        </div>

        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex space-x-2">
            <div className="h-10 w-45 animate-pulse rounded bg-muted" />
            <div className="h-10 w-45 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-64 animate-pulse rounded bg-muted" />
        </div>

        <div className="space-y-12">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="relative">
                <div className="py-3">
                  <div className="flex items-center">
                    <div className="size-10 animate-pulse rounded-full bg-muted" />
                    <div className="ml-4 h-6 w-16 animate-pulse rounded bg-muted" />
                    <div className="ml-2 h-5 w-24 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="mt-4 h-px w-full bg-muted" />
                </div>

                <div className="mt-6 space-y-6 pl-14">
                  {Array(2)
                    .fill(0)
                    .map((_, j) => (
                      <div key={j} className="relative">
                        <div className="absolute -left-9 mt-1 size-4 rounded-full border-2 border-muted bg-background"></div>
                        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
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
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

