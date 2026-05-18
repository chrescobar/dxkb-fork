import { Skeleton } from "@/components/ui/skeleton";

export function DataSummarySkeleton() {
  return (
    <div className="bacteria-card p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-12" />
      </div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="bacteria-stat-row">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

export function FeaturedGeneraSkeleton() {
  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <article key={i} className="bacteria-genus-hero">
            <Skeleton className="aspect-[5/3] w-full" />
            <div className="px-3 py-3 flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-7 w-20" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function GeneraTableSkeleton() {
  return (
    <div className="bacteria-card overflow-hidden">
      <div className="px-5 py-3 flex items-center justify-between border-b border-[var(--border)]">
        <div className="space-y-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="bacteria-genus-row">
          <Skeleton className="h-[22px] w-[22px] rounded-md" />
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-12 justify-self-end" />
          <Skeleton className="h-1.5 w-full" />
        </div>
      ))}
    </div>
  );
}

export function MetadataDistributionsSkeleton() {
  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bacteria-card p-5">
            <div className="flex items-center justify-between mb-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-24 mb-4" />
            <div className="flex items-center justify-center mb-4">
              <Skeleton className="w-[160px] h-[160px] rounded-full" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
