import { useQuery } from "@tanstack/react-query";
import { fetchFeaturesFromGroup } from "@/lib/services/feature";
import { serviceQueryKeys } from "@/lib/services/service-query-keys";

export function useFeatureGroupMembers(
  groupPath: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: serviceQueryKeys.featureGroupMembers(groupPath ?? ""),
    queryFn: ({ signal }) => fetchFeaturesFromGroup(groupPath ?? "", { signal }),
    enabled: enabled && !!groupPath,
    staleTime: 5 * 60 * 1000,
  });
}
