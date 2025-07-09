import { useCallback } from "react";
import { useAuth } from "../contexts/auth-context";
import { cookies } from "next/headers";
import { safeDecodeURIComponent } from "../app/api/auth/utils";

// Client-side authenticated fetch hook
export function useAuthenticatedFetch() {
  const { user, refreshAuth } = useAuth();

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
        await refreshAuth();
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
    [user, refreshAuth],
  );
}

// Server-side authenticated fetch for API routes
export async function serverAuthenticatedFetch(
  url: string,
  options: RequestInit = {},
) {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get("token")?.value;
  const token = rawToken ? safeDecodeURIComponent(rawToken) : undefined;

  if (!token) {
    throw new Error("Not authenticated");
  }

  const headers = {
    ...options.headers,
    Authorization: token,
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}
