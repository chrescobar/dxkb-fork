import { apiFetch } from "@/lib/auth/fetch";
import { ApiCallError, statusToErrorCode } from "./types";

async function handleResponse<T>(response: Response): Promise<T> {
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
    error?: unknown;
    message?: unknown;
    details?: unknown;
  };
  const message =
    typeof body.error === "string"
      ? body.error
      : typeof body.message === "string"
        ? body.message
        : `HTTP ${response.status} ${response.statusText}`;

  throw new ApiCallError({
    message,
    status: response.status,
    code: statusToErrorCode(response.status),
    details: body.details,
  });
}

export async function apiCall<T>(
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
  return handleResponse<T>(response);
}

export async function apiGet<T>(
  url: string,
  params?: Record<string, string | number | boolean | undefined>,
  init?: Omit<RequestInit, "method" | "body" | "credentials">,
): Promise<T> {
  let fullUrl = url;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) fullUrl = `${url}?${qs}`;
  }

  const response = await apiFetch(fullUrl, { ...init, method: "GET" });
  return handleResponse<T>(response);
}
