"use client";

import type { AuthError, Result } from "@/lib/auth/port";
import { getActiveAuthStore } from "@/lib/auth/store";
import type {
  AuthEventHandler,
  AuthEventName,
} from "@/lib/auth/events";
import type {
  AuthUser,
  SignupCredentials,
} from "@/lib/auth/types";

function requireStore() {
  const store = getActiveAuthStore();
  if (!store) {
    throw new Error(
      "Advanced auth API called before <AuthBoundary> mounted. Wrap your app with <AuthBoundary> before using authAdmin or authAccount.",
    );
  }
  return store;
}

function notMountedError(): AuthError {
  return {
    message: "Auth is not ready",
    code: "unknown",
  };
}

export const authAdmin = {
  impersonate: {
    async start(
      targetUser: string,
      password: string,
    ): Promise<Result<AuthUser>> {
      const store = getActiveAuthStore();
      if (!store) return { data: null, error: notMountedError() };
      return store.impersonate(targetUser, password);
    },
    async exit(): Promise<Result<AuthUser>> {
      const store = getActiveAuthStore();
      if (!store) return { data: null, error: notMountedError() };
      return store.exitImpersonation();
    },
    state(): { isImpersonating: boolean; originalUsername: string | null } {
      const snapshot = getActiveAuthStore()?.snapshot();
      return {
        isImpersonating: snapshot?.user?.isImpersonating ?? false,
        originalUsername: snapshot?.user?.originalUsername ?? null,
      };
    },
  },
  on<E extends AuthEventName>(
    event: E,
    handler: AuthEventHandler<E>,
  ): () => void {
    return requireStore().events.on(event, handler);
  },
};

export const authAccount = {
  async signUp(input: SignupCredentials): Promise<Result<AuthUser>> {
    const store = getActiveAuthStore();
    if (!store) return { data: null, error: notMountedError() };
    return store.signUp(input);
  },
  async requestPasswordReset(
    usernameOrEmail: string,
  ): Promise<Result<void>> {
    const store = getActiveAuthStore();
    if (!store) return { data: null, error: notMountedError() };
    return store.requestPasswordReset(usernameOrEmail);
  },
  async sendVerificationEmail(): Promise<Result<void>> {
    const store = getActiveAuthStore();
    if (!store) return { data: null, error: notMountedError() };
    return store.sendVerificationEmail();
  },
  async refresh(): Promise<void> {
    const store = getActiveAuthStore();
    if (!store) return;
    return store.refresh();
  },
};
