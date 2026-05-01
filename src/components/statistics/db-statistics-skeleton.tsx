import { Skeleton } from "@/components/ui/skeleton";

const placeholderCount = 8;

const DBStatisticsSkeleton = () => {
  return (
    <section className="py-12 bg-primary text-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 text-center">Database Statistics</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {Array.from({ length: placeholderCount }).map((_, index) => (
            <div key={index} data-testid="db-statistics-skeleton-cell">
              <Skeleton className="h-10 w-24 mx-auto mb-2 bg-white/20" />
              <Skeleton className="h-4 w-28 mx-auto bg-white/20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DBStatisticsSkeleton;
