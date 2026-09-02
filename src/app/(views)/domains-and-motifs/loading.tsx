import { Skeleton } from "@/components/ui/skeleton";

export default function DomainsAndMotifsLoading() {
  return (
    <div
      className="flex flex-1 flex-col gap-4 px-4 pb-4"
      role="status"
      aria-label="Loading domains and motifs"
    >
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="min-h-96 w-full flex-1" />
    </div>
  );
}
