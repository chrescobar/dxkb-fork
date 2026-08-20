import { NextRequest } from "next/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

const testCookies = new Map<string, string>();

export const testCookieStore = {
  get: vi.fn((name: string) => {
    const value = testCookies.get(name);
    return value === undefined ? undefined : { name, value };
  }),
  set: vi.fn((name: string, value: string, _options?: unknown) => {
    if (value) testCookies.set(name, value);
    else testCookies.delete(name);
  }),
};

export function clearTestCookies(): void {
  testCookies.clear();
  testCookieStore.get.mockClear();
  testCookieStore.set.mockClear();
}

export function mockSessionCookies({
  token = "test-token",
  userId = "testuser",
  realm,
}: {
  token?: string;
  userId?: string;
  realm?: string;
} = {}): void {
  testCookies.set("bvbrc_token", token);
  testCookies.set("bvbrc_user_id", userId);
  if (realm) testCookies.set("bvbrc_realm", realm);
  else testCookies.delete("bvbrc_realm");
}

export const setTestSession = mockSessionCookies;

/**
 * Factory for creating mock NextRequest objects for route handler tests.
 */
export function mockNextRequest(
  opts: {
    method?: string;
    url?: string;
    body?: unknown;
    rawBody?: BodyInit;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {},
): NextRequest {
  const {
    method = "GET",
    url: baseUrl = "http://localhost:3019/api/test",
    body,
    rawBody,
    headers = {},
    searchParams,
  } = opts;

  let finalUrl = baseUrl;
  if (searchParams) {
    const params = new URLSearchParams(searchParams);
    finalUrl = `${baseUrl}?${params.toString()}`;
  }

  const init: Record<string, unknown> = {
    method,
    headers:
      body !== undefined && rawBody === undefined && method !== "GET"
        ? { "Content-Type": "application/json", ...headers }
        : headers,
  };

  if (method !== "GET") {
    if (rawBody !== undefined) init.body = rawBody;
    else if (body !== undefined) init.body = JSON.stringify(body);
  }

  return new NextRequest(finalUrl, init);
}

/**
 * Creates a QueryClientProvider wrapper for use with renderHook.
 * Configured with retry: false for test stability.
 */
export function createQueryClientWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

export function makeRouteContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

export async function json<T = unknown>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
