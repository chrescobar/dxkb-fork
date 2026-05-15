import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchGenomeGroupMembers, type GenomeSummary } from "@/lib/services/genome";
import { serviceQueryKeys } from "@/lib/services/service-query-keys";

export function useCachedGenomeGroupLoader() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(
    async (groupPath: string): Promise<GenomeSummary[]> => {
      setIsLoading(true);
      setError(null);
      try {
        const genomes = await queryClient.ensureQueryData({
          queryKey: serviceQueryKeys.genomeGroupMembers(groupPath),
          queryFn: ({ signal }) => fetchGenomeGroupMembers(groupPath, { signal }),
          staleTime: 5 * 60 * 1000,
        });
        setIsLoading(false);
        return genomes;
      } catch (err) {
        const normalized = err instanceof Error ? err : new Error(String(err));
        setIsLoading(false);
        setError(normalized);
        throw normalized;
      }
    },
    [queryClient],
  );

  return { load, isLoading, error };
}
