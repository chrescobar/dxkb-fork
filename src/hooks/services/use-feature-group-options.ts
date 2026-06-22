"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchFeaturesFromGroup,
  type FeatureSummary,
} from "@/lib/services/feature";

interface UseFeatureGroupOptionsReturn {
  features: FeatureSummary[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Reactively fetches features from a feature group path via TanStack Query.
 * Returns [] when disabled or path is empty; handles abort automatically.
 */
export function useFeatureGroupOptions(
  featureGroupPath: string | undefined,
  enabled = true,
): UseFeatureGroupOptionsReturn {
  const path = featureGroupPath ?? "";
  const shouldFetch = enabled && !!path.trim();

  const { data = [], isFetching, error } = useQuery({
    queryKey: ["featureGroupOptions", path],
    queryFn: ({ signal }) => fetchFeaturesFromGroup(path, { signal }),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    features: data,
    isLoading: shouldFetch && isFetching,
    error: error instanceof Error ? error.message : null,
  };
}
