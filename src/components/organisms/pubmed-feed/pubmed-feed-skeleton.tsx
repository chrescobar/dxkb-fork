import { Skeleton } from "@/components/ui/skeleton";

export function PubMedFeedSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-14 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
    </div>
  );
}
