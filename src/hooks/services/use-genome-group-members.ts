import { useQuery } from "@tanstack/react-query";
import { fetchGenomeGroupMembers } from "@/lib/services/genome";
import { serviceQueryKeys } from "@/lib/services/service-query-keys";

export function useGenomeGroupMembers(
  groupPath: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: serviceQueryKeys.genomeGroupMembers(groupPath ?? ""),
    queryFn: ({ signal }) => fetchGenomeGroupMembers(groupPath ?? "", { signal }),
    enabled: enabled && !!groupPath,
    staleTime: 5 * 60 * 1000,
  });
}
