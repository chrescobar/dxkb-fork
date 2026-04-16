"use client";

import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseQueryResult,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import type { ApiCallError } from "./types";

export function useApiQuery<TData>(
  options: Omit<UseQueryOptions<TData, ApiCallError>, "throwOnError">,
): UseQueryResult<TData, ApiCallError> {
  return useQuery<TData, ApiCallError>(options);
}

export function useApiMutation<TData, TVariables>(
  options: UseMutationOptions<TData, ApiCallError, TVariables>,
): UseMutationResult<TData, ApiCallError, TVariables> {
  return useMutation<TData, ApiCallError, TVariables>(options);
}
