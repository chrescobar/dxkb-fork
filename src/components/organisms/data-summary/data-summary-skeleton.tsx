import { Skeleton } from "@/components/ui/skeleton";

export function DataSummarySkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-2">
      {Array.from({ length: 7 }).map((_, index) => (
        <Skeleton key={index} className="h-16 rounded-md" />
      ))}
    </div>
  );
}
