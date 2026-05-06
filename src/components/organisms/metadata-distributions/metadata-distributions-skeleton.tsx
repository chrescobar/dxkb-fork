import { Skeleton } from "@/components/ui/skeleton";

export function MetadataDistributionsSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-80 rounded-lg" />
      ))}
    </div>
  );
}
