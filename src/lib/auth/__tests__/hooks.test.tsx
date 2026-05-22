import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";

import { useAuth, useSignIn } from "@/lib/auth/hooks";
import { AuthBoundary } from "@/lib/auth/provider";
import { memoryAuthAdapter } from "@/lib/auth/adapters/memory";
import type { AuthUser } from "@/lib/auth/types";

const alice: AuthUser = {
  username: "alice",
  email: "alice@example.com",
  token: "t-alice",
  email_verified: true,
};

function makeWrapper(port: ReturnType<typeof memoryAuthAdapter>, initialUser?: AuthUser | null) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthBoundary port={port} initialUser={initialUser}>
        {children}
      </AuthBoundary>
    );
  }
  return Wrapper;
}

describe("useAuth", () => {
  it("returns authed status with user when initialUser is provided", async () => {
    const port = memoryAuthAdapter({ initialSession: alice });
    const wrapper = makeWrapper(port, alice);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("authed"));
    expect(result.current.user).toMatchObject(expect.objectContaining({ username: "alice" }));
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("returns guest status when no initial user", async () => {
    const port = memoryAuthAdapter({ initialSession: null });
    const wrapper = makeWrapper(port, null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("guest"));
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("calls store.signOut when signOut is invoked", async () => {
    const port = memoryAuthAdapter({ initialSession: alice });
    const signOutSpy = vi.spyOn(port, "signOut");
    const wrapper = makeWrapper(port, alice);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signOut();
    });

    expect(signOutSpy).toHaveBeenCalled();
  });

  it("reports isVerified false when email_verified is false", () => {
    const unverified: AuthUser = { ...alice, email_verified: false };
    const port = memoryAuthAdapter({ initialSession: unverified });
    const wrapper = makeWrapper(port, unverified);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isVerified).toBe(false);
  });

  it("reports isAdmin true when user has admin role", () => {
    const admin: AuthUser = { ...alice, roles: ["admin"] };
    const port = memoryAuthAdapter({ initialSession: admin });
    const wrapper = makeWrapper(port, admin);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAdmin).toBe(true);
  });
});

describe("useSignIn", () => {
  it("returns isPending false and error null initially", () => {
    const port = memoryAuthAdapter();
    const wrapper = makeWrapper(port);

    const { result } = renderHook(() => useSignIn(), { wrapper });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("resolves with user data on successful sign-in", async () => {
    const port = memoryAuthAdapter({
      accounts: [{ user: alice, password: "secret" }],
    });
    const wrapper = makeWrapper(port);

    const { result } = renderHook(() => useSignIn(), { wrapper });

    let signInResult: Awaited<ReturnType<typeof result.current.signIn>> | undefined;
    await act(async () => {
      signInResult = await result.current.signIn({ username: "alice", password: "secret" });
    });

    expect(signInResult?.error).toBeNull();
    expect(signInResult?.data).toMatchObject(expect.objectContaining({ username: "alice" }));
    expect(result.current.isPending).toBe(false);
  });

  it("sets error on failed sign-in", async () => {
    const port = memoryAuthAdapter({
      accounts: [{ user: alice, password: "secret" }],
    });
    const wrapper = makeWrapper(port);

    const { result } = renderHook(() => useSignIn(), { wrapper });

    await act(async () => {
      await result.current.signIn({ username: "alice", password: "wrong" });
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.code).toBe("invalid_credentials");
    expect(result.current.isPending).toBe(false);
  });
});
