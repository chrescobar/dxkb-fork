import { Skeleton } from "@/components/ui/skeleton";

export function ArchaeopteryxLoading() {
  return (
    <div className="flex h-full min-h-80 flex-col gap-3 p-4" aria-label="Loading phylogenetic tree">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="min-h-72 flex-1" />
    </div>
  );
}
