import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import React from "react";

import { useCachedFeatureGroupLoader } from "@/hooks/services/use-cached-feature-group-loader";
import { server } from "@/test-helpers/msw-server";

function featureGroupResponse(
  features: { feature_id: string; patric_id?: string }[],
) {
  return { results: features };
}

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useCachedFeatureGroupLoader", () => {
  it("loads features for a group path", async () => {
    server.use(
      http.post("/api/services/feature/from-group", () =>
        HttpResponse.json(
          featureGroupResponse([{ feature_id: "f1", patric_id: "PATRIC.1" }]),
        ),
      ),
    );

    const { result } = renderHook(() => useCachedFeatureGroupLoader(), {
      wrapper: makeWrapper(),
    });

    let features;
    await act(async () => {
      features = await result.current.load("/user/my-group");
    });

    expect(features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ feature_id: "f1" }),
      ]),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("reuses cached data on repeated loads of the same path (single request)", async () => {
    let callCount = 0;
    server.use(
      http.post("/api/services/feature/from-group", () => {
        callCount++;
        return HttpResponse.json(
          featureGroupResponse([{ feature_id: "f1" }]),
        );
      }),
    );

    const { result } = renderHook(() => useCachedFeatureGroupLoader(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.load("/user/same-group");
    });

    await act(async () => {
      await result.current.load("/user/same-group");
    });

    expect(callCount).toBe(1);
  });

  it("surfaces load errors and sets error state", async () => {
    server.use(
      http.post("/api/services/feature/from-group", () =>
        HttpResponse.json({ error: "Not found" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useCachedFeatureGroupLoader(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.load("/user/bad-group").catch((err: unknown) => err);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.isLoading).toBe(false);
  });

  it("throws so callers can catch", async () => {
    server.use(
      http.post("/api/services/feature/from-group", () =>
        HttpResponse.json({ error: "Group not found" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useCachedFeatureGroupLoader(), {
      wrapper: makeWrapper(),
    });

    let thrown: unknown;
    await act(async () => {
      await result.current.load("/user/bad-group").catch((err) => {
        thrown = err;
      });
    });

    expect(thrown).toBeInstanceOf(Error);
  });

  it("does not expose useMutation semantics", () => {
    const { result } = renderHook(() => useCachedFeatureGroupLoader(), {
      wrapper: makeWrapper(),
    });

    const keys = Object.keys(result.current);
    expect(keys).toContain("load");
    expect(keys).toContain("isLoading");
    expect(keys).toContain("error");
    expect(keys).not.toContain("mutate");
    expect(keys).not.toContain("mutateAsync");
    expect(keys).not.toContain("isPending");
    expect(keys).not.toContain("isIdle");
  });
});
