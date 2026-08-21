import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { ProfilePatch } from "@/lib/auth/types";

import * as authClient from "@/lib/auth/client";
import { AuthBoundary, useAuth, useAuthActions } from "@/lib/auth/provider";

const { navigation, refreshMock, replaceMock } = vi.hoisted(() => ({
  navigation: {
    pathname: "/",
    searchParams: new URLSearchParams(),
    suspendSearchParams: false,
  },
  refreshMock: vi.fn(),
  replaceMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => {
    if (navigation.suspendSearchParams) {
      // React Suspense requires throwing a pending thenable.
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw new Promise(() => undefined);
    }
    return navigation.searchParams;
  },
  useRouter: () => ({ refresh: refreshMock, replace: replaceMock }),
}));

vi.mock("@/lib/auth/client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/auth/client")>();
  return {
    ...original,
    signIn: vi.fn(),
    signUp: vi.fn(),
    startImpersonation: vi.fn(),
    exitImpersonation: vi.fn(),
    updateProfile: vi.fn(),
  };
});

const user = { id: "alice", username: "alice", email: "alice@example.test" };
const signupInput = {
  email: "alice@example.test",
  username: "alice",
  first_name: "Alice",
  last_name: "Example",
  password: "password",
  password_repeat: "password",
};

beforeEach(() => {
  navigation.pathname = "/";
  navigation.searchParams = new URLSearchParams();
  navigation.suspendSearchParams = false;
});

function Wrapper({
  children,
  queryClient,
}: {
  children: ReactNode;
  queryClient: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBoundary user={user}>{children}</AuthBoundary>
    </QueryClientProvider>
  );
}

describe("AuthBoundary", () => {
  it("requires an AuthBoundary", () => {
    function Consumer() {
      useAuth();
      return null;
    }

    expect(() => render(<Consumer />)).toThrow(
      "useAuth must be used within <AuthBoundary>",
    );
  });

  it("exposes the server-provided user without loading state", () => {
    function Consumer() {
      const auth = useAuth();
      return (
        <span>{auth.isAuthenticated ? auth.user?.username : "guest"}</span>
      );
    }

    const queryClient = new QueryClient();
    render(<Consumer />, {
      wrapper: ({ children }) => (
        <Wrapper queryClient={queryClient}>{children}</Wrapper>
      ),
    });
    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  it.each([
    {
      name: "sign-in",
      setup: () => vi.mocked(authClient.signIn).mockResolvedValue(user),
      invoke: (actions: ReturnType<typeof useAuthActions>) =>
        actions.signIn({ username: "alice", password: "password" }),
      refreshes: false,
    },
    {
      name: "sign-up",
      setup: () => vi.mocked(authClient.signUp).mockResolvedValue(user),
      invoke: (actions: ReturnType<typeof useAuthActions>) =>
        actions.signUp(signupInput),
      refreshes: true,
    },
    {
      name: "start impersonation",
      setup: () =>
        vi
          .mocked(authClient.startImpersonation)
          .mockResolvedValue({ ...user, username: "bob" }),
      invoke: (actions: ReturnType<typeof useAuthActions>) =>
        actions.startImpersonation("bob", "password"),
      refreshes: true,
    },
    {
      name: "exit impersonation",
      setup: () =>
        vi.mocked(authClient.exitImpersonation).mockResolvedValue(user),
      invoke: (actions: ReturnType<typeof useAuthActions>) =>
        actions.exitImpersonation(),
      refreshes: true,
    },
  ])(
    "clears account cache after $name",
    async ({ setup, invoke, refreshes }) => {
      setup();
      const queryClient = new QueryClient();
      queryClient.setQueryData(["private"], { secret: true });
      const clearSpy = vi.spyOn(queryClient, "clear");
      const { result } = renderHook(() => useAuthActions(), {
        wrapper: ({ children }) => (
          <Wrapper queryClient={queryClient}>{children}</Wrapper>
        ),
      });

      await invoke(result.current);

      expect(clearSpy).toHaveBeenCalledOnce();
      expect(queryClient.getQueryData(["private"])).toBeUndefined();
      expect(refreshMock).toHaveBeenCalledTimes(refreshes ? 1 : 0);
    },
  );

  it("invalidates the profile and refreshes after updating it", async () => {
    vi.mocked(authClient.updateProfile).mockResolvedValue();
    const patches: ProfilePatch[] = [
      { op: "replace", path: "/first_name", value: "Alicia" },
    ];
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const clearSpy = vi.spyOn(queryClient, "clear");
    const { result } = renderHook(() => useAuthActions(), {
      wrapper: ({ children }) => (
        <Wrapper queryClient={queryClient}>{children}</Wrapper>
      ),
    });

    await result.current.updateProfile(patches);
    expect(authClient.updateProfile).toHaveBeenCalledWith(patches);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["user-profile"] });
    expect(clearSpy).not.toHaveBeenCalled();
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("redirects a guest from a protected path with the full return URL", async () => {
    navigation.pathname = "/workspace/alice";
    navigation.searchParams = new URLSearchParams("folder=My Data");
    render(
      <AuthBoundary user={null}>
        <span>protected content</span>
      </AuthBoundary>,
    );

    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/sign-in?redirect=%2Fworkspace%2Falice%3Ffolder%3DMy%2BData",
      );
    });
  });

  it("does not redirect guests from public paths or authenticated users", async () => {
    const { rerender } = render(
      <AuthBoundary user={null}>
        <span>public content</span>
      </AuthBoundary>,
    );

    await waitFor(() => {
      expect(replaceMock).not.toHaveBeenCalled();
    });
    navigation.pathname = "/settings";
    rerender(
      <AuthBoundary user={user}>
        <span>protected content</span>
      </AuthBoundary>,
    );
    await waitFor(() => {
      expect(replaceMock).not.toHaveBeenCalled();
    });
  });

  it("hides protected children while the guard suspends", () => {
    navigation.pathname = "/settings";
    navigation.suspendSearchParams = true;

    render(
      <AuthBoundary user={null}>
        <span>settings content</span>
      </AuthBoundary>,
    );

    expect(screen.queryByText("settings content")).not.toBeInTheDocument();
  });
});
