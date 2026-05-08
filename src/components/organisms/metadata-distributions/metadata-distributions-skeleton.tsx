import { Skeleton } from "@/components/ui/skeleton";

export function MetadataDistributionsSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-80 rounded-lg" />
      ))}
    </div>
  );
}
