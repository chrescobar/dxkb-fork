import { Skeleton } from "@/components/ui/skeleton";

export function GeneraGridSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-2">
      {Array.from({ length: 12 }).map((_, index) => (
        <Skeleton key={index} className="h-12 rounded-md" />
      ))}
    </div>
  );
}
