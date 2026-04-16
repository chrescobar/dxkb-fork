import { getActiveAuthStore } from "@/lib/auth/store";

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const store = getActiveAuthStore();
  if (store) return store.authenticatedFetch(input, init);
  return fetch(input, { ...init, credentials: "include" });
}

export interface ApiJsonError extends Error {
  status: number;
  details?: unknown;
}

export async function apiJson<T>(
  url: string,
  body: unknown,
  init?: Omit<RequestInit, "method" | "body" | "credentials">,
): Promise<T> {
  const response = await apiFetch(url, {
    ...init,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    body: JSON.stringify(body),
  });
  return readJson<T>(response);
}

export async function apiGetJson<T>(
  url: string,
  params?: Record<string, string | number | boolean | undefined>,
  init?: Omit<RequestInit, "method" | "body" | "credentials">,
): Promise<T> {
  let fullUrl = url;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) searchParams.set(key, String(value));
    }
    const qs = searchParams.toString();
    if (qs) fullUrl = `${url}?${qs}`;
  }
  const response = await apiFetch(fullUrl, { ...init, method: "GET" });
  return readJson<T>(response);
}

async function readJson<T>(response: Response): Promise<T> {
  if (response.ok) {
    const text = await response.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as T;
    }
  }
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
    details?: unknown;
  };
  const message =
    (typeof body.error === "string" && body.error) ||
    (typeof body.message === "string" && body.message) ||
    `HTTP ${response.status} ${response.statusText}`;
  const error = new Error(message) as ApiJsonError;
  error.status = response.status;
  error.details = body.details;
  throw error;
}
