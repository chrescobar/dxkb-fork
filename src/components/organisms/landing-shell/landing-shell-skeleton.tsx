import { Skeleton } from "@/components/ui/skeleton";

export function OrganismLandingShellSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-none gap-3 px-2 sm:px-3 lg:px-4">
      <Skeleton className="h-96 w-56 rounded-lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );
}
