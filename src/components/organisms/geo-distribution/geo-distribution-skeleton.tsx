import { Skeleton } from "@/components/ui/skeleton";

export function GeoDistributionSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-[480px] rounded-lg" />
    </div>
  );
}
