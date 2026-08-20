import type { AuthError, AuthErrorCode, Result } from "@/lib/auth/types";

export function ok<T>(data: T): Result<T> {
  return { data, error: null };
}

export function fail<T>(
  code: AuthErrorCode,
  message: string,
  status?: number,
): Result<T> {
  return { data: null, error: { code, message, status } };
}

export function networkFailure(cause: unknown, fallback: string): AuthError {
  return {
    message: cause instanceof Error ? cause.message : fallback,
    code: "network",
    status: 502,
  };
}
