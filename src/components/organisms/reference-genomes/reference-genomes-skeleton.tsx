import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ReferenceGenomesSkeleton() {
  return (
    <Card className="rounded-lg" size="sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-7 w-32 rounded-md" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-1">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-8 rounded-sm" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
