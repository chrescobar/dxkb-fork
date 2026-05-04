import DBStatisticsShell from "@/components/statistics/db-statistics-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { dbStatisticsDefinitions } from "@/lib/services/statistics";

const DBStatisticsSkeleton = () => {
  return (
    <DBStatisticsShell>
      {dbStatisticsDefinitions.map((definition) => (
        <div key={definition.key} data-testid="db-statistics-skeleton-cell">
          <Skeleton className="h-10 w-24 mx-auto mb-2 bg-white/20" />
          <Skeleton className="h-4 w-28 mx-auto bg-white/20" />
        </div>
      ))}
    </DBStatisticsShell>
  );
};

export default DBStatisticsSkeleton;
