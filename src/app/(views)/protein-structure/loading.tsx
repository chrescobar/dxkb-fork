import { Skeleton } from "@/components/ui/skeleton";

export default function ProteinStructureLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pb-4" role="status" aria-label="Loading protein structures">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="min-h-96 w-full flex-1" />
    </div>
  );
}
