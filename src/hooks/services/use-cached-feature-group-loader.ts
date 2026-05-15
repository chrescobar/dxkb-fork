import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchFeaturesFromGroup, type FeatureSummary } from "@/lib/services/feature";
import { serviceQueryKeys } from "@/lib/services/service-query-keys";

export function useCachedFeatureGroupLoader() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(
    async (groupPath: string): Promise<FeatureSummary[]> => {
      setIsLoading(true);
      setError(null);
      try {
        const features = await queryClient.ensureQueryData({
          queryKey: serviceQueryKeys.featureGroupMembers(groupPath),
          queryFn: ({ signal }) => fetchFeaturesFromGroup(groupPath, { signal }),
          staleTime: 5 * 60 * 1000,
        });
        setIsLoading(false);
        return features;
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
