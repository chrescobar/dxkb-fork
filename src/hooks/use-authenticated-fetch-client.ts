"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "../contexts/auth-context";

// Client-side authenticated fetch hook
export function useAuthenticatedFetch() {
  const { refreshAuth } = useAuth();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedRefreshAuth = useMemo(() => refreshAuth, []);

  return useCallback(
    async (url: string, options: RequestInit = {}) => {
      // For client-side requests, we rely on cookies being automatically included
      const response = await fetch(url, {
        ...options,
        credentials: "include", // Ensure cookies are sent
        headers: {
          ...options.headers,
          "Content-Type": "application/json",
        },
      });

      // If token expired, try to refresh
      if (response.status === 401) {
        await memoizedRefreshAuth();
        // Retry the request after refresh
        const retryResponse = await fetch(url, {
          ...options,
          credentials: "include",
          headers: {
            ...options.headers,
            "Content-Type": "application/json",
          },
        });
        return retryResponse;
      }

      return response;
    },
    [memoizedRefreshAuth],
  );
}
