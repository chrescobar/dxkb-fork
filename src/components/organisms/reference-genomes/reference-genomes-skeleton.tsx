import { Skeleton } from "@/components/ui/skeleton";

export function ReferenceGenomesSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-5 w-32" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-12 rounded-md" />
        ))}
      </div>
    </div>
  );
}
