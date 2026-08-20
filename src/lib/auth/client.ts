"use client";

import type {
  AuthUser,
  SigninCredentials,
  SignupCredentials,
  UserProfile,
} from "@/lib/auth/types";

interface SessionEnvelope {
  user: AuthUser | null;
}

interface ErrorEnvelope {
  error?: unknown;
  message?: unknown;
  code?: unknown;
}

export class AuthClientError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(message: string, options?: { status?: number; code?: string }) {
    super(message);
    this.name = "AuthClientError";
    this.status = options?.status;
    this.code = options?.code;
  }
}

async function requestJson<T>(
  url: string,
  init: RequestInit = {},
  fallback: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, credentials: "include" });
  } catch (cause) {
    throw new AuthClientError(
      cause instanceof Error ? cause.message : fallback,
      { code: "network" },
    );
  }

  const text = await response.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }

  if (!response.ok) {
    const error = body as ErrorEnvelope | undefined;
    const message =
      typeof error?.error === "string"
        ? error.error
        : typeof error?.message === "string"
          ? error.message
          : fallback;
    throw new AuthClientError(message, {
      status: response.status,
      code: typeof error?.code === "string" ? error.code : undefined,
    });
  }

  return body as T;
}

function postJson<T>(url: string, body: unknown, fallback: string): Promise<T> {
  return requestJson<T>(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    fallback,
  );
}

async function requireUser(
  request: Promise<SessionEnvelope>,
  fallback: string,
): Promise<AuthUser> {
  const envelope = await request;
  if (!envelope.user) throw new AuthClientError(fallback);
  return envelope.user;
}

export function signIn(credentials: SigninCredentials): Promise<AuthUser> {
  return requireUser(
    postJson("/api/auth/sign-in/email", credentials, "Sign in failed"),
    "Sign in failed",
  );
}

export function signUp(input: SignupCredentials): Promise<AuthUser> {
  return requireUser(
    postJson("/api/auth/sign-up/email", input, "Sign up failed"),
    "Sign up failed",
  );
}

export function startImpersonation(
  targetUser: string,
  password: string,
): Promise<AuthUser> {
  return requireUser(
    postJson(
      "/api/auth/su-login",
      { targetUser, password },
      "Impersonation failed",
    ),
    "Impersonation failed",
  );
}

export function exitImpersonation(): Promise<AuthUser> {
  return requireUser(
    postJson("/api/auth/su-exit", undefined, "Failed to exit impersonation"),
    "Failed to exit impersonation",
  );
}

export function requestPasswordReset(usernameOrEmail: string): Promise<void> {
  return postJson(
    "/api/auth/forget-password",
    { usernameOrEmail },
    "Password reset request failed",
  );
}

export function sendVerificationEmail(): Promise<void> {
  return postJson(
    "/api/auth/send-verification-email",
    undefined,
    "Failed to send verification email",
  );
}

export function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  return postJson(
    "/api/auth/change-password",
    { currentPassword, newPassword },
    "Failed to change password",
  );
}

export function getProfile(): Promise<UserProfile> {
  return requestJson("/api/auth/profile", {}, "Failed to load profile");
}

export function updateProfile(patches: unknown): Promise<void> {
  return postJson("/api/auth/profile", patches, "Failed to update profile");
}
