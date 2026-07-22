import { Skeleton } from "@/components/ui/skeleton";

export function DataSummarySkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-1.5">
      {Array.from({ length: 7 }).map((_, index) => (
        <Skeleton key={index} className="h-12 rounded-md" />
      ))}
    </div>
  );
}
