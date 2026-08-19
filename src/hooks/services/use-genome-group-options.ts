"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getGenomeIdsFromGroup,
  fetchGenomesByIds,
  type GenomeSummary,
} from "@/lib/services/genome";

interface UseGenomeGroupOptionsReturn {
  options: GenomeSummary[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Reactively fetches genome summaries from a genome group path via TanStack Query.
 * Internally calls getGenomeIdsFromGroup then fetchGenomesByIds.
 * Returns [] when disabled or groupPath is empty; handles abort automatically.
 */
export function useGenomeGroupOptions(
  groupPath: string | undefined,
  enabled = true,
): UseGenomeGroupOptionsReturn {
  const path = groupPath ?? "";
  const shouldFetch = enabled && !!path.trim();

  const { data = [], isFetching, error } = useQuery({
    queryKey: ["genomeGroupOptions", path],
    queryFn: async ({ signal }) => {
      const genomeIds = await getGenomeIdsFromGroup(path, { signal });
      if (genomeIds.length === 0) return [];
      return fetchGenomesByIds(genomeIds, { signal });
    },
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    options: data,
    isLoading: shouldFetch && isFetching,
    error: error instanceof Error ? error.message : null,
  };
}
