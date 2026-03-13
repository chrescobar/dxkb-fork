import { renderHook } from "@testing-library/react";
import React from "react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => ({ toString: () => "" }),
}));

vi.mock("@/lib/auth-client", () => ({
  bvbrcAuth: {
    getSession: vi.fn(() => Promise.resolve({ data: null, error: null })),
    signOut: vi.fn(() => Promise.resolve()),
    signIn: {
      email: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
    signUp: {
      email: vi.fn(() => Promise.resolve({ error: null })),
    },
    requestPasswordReset: vi.fn(() => Promise.resolve({ error: null })),
    sendVerificationEmail: vi.fn(() => Promise.resolve({ error: null })),
  },
}));

import { AuthProvider, useAuth } from "../auth-context";

describe("AuthContext", () => {
  it("useAuth throws outside provider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth must be used within an AuthProvider",
    );
  });

  it("provides initialUser when passed", () => {
    const testUser = {
      username: "testuser",
      email: "test@example.com",
      token: "abc123",
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider initialUser={testUser}>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(
      expect.objectContaining({
        username: "testuser",
        email: "test@example.com",
        token: "abc123",
      }),
    );
  });

  it("isAuthenticated is true when user exists", () => {
    const testUser = {
      username: "testuser",
      email: "test@example.com",
      token: "abc123",
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider initialUser={testUser}>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it("isAuthenticated is false when no user", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
  });
});
