import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import React from "react";

import { useCachedGenomeGroupLoader } from "@/hooks/services/use-cached-genome-group-loader";
import { server } from "@/test-helpers/msw-server";

function workspaceGetResponse(genomeIds: string[]) {
  return {
    result: [
      [
        [
          {},
          { id_list: { genome_id: genomeIds } },
        ],
      ],
    ],
  };
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

describe("useCachedGenomeGroupLoader", () => {
  it("loads genomes for a group path", async () => {
    server.use(
      http.post("/api/services/workspace", () =>
        HttpResponse.json(workspaceGetResponse(["genome1", "genome2"])),
      ),
      http.post("/api/services/genome/by-ids", () =>
        HttpResponse.json({
          results: [
            { genome_id: "genome1", genome_name: "Genome One" },
            { genome_id: "genome2", genome_name: "Genome Two" },
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useCachedGenomeGroupLoader(), {
      wrapper: makeWrapper(),
    });

    let genomes;
    await act(async () => {
      genomes = await result.current.load("/user/genome-group");
    });

    expect(genomes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ genome_id: "genome1" }),
        expect.objectContaining({ genome_id: "genome2" }),
      ]),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("reuses cached data for repeated loads of the same group", async () => {
    let workspaceCalls = 0;
    server.use(
      http.post("/api/services/workspace", () => {
        workspaceCalls++;
        return HttpResponse.json(workspaceGetResponse(["genome1"]));
      }),
      http.post("/api/services/genome/by-ids", () =>
        HttpResponse.json({
          results: [{ genome_id: "genome1", genome_name: "Genome One" }],
        }),
      ),
    );

    const { result } = renderHook(() => useCachedGenomeGroupLoader(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.load("/user/genome-group");
    });

    await act(async () => {
      await result.current.load("/user/genome-group");
    });

    expect(workspaceCalls).toBe(1);
  });

  it("surfaces load errors and sets error state", async () => {
    server.use(
      http.post("/api/services/workspace", () =>
        HttpResponse.json({ error: "Not found" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useCachedGenomeGroupLoader(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.load("/user/genome-group").catch((err: unknown) => err);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.isLoading).toBe(false);
  });

  it("throws the error so callers can handle it", async () => {
    server.use(
      http.post("/api/services/workspace", () =>
        HttpResponse.json({ error: "Group not found" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useCachedGenomeGroupLoader(), {
      wrapper: makeWrapper(),
    });

    let thrown: unknown;
    await act(async () => {
      await result.current.load("/user/genome-group").catch((err) => {
        thrown = err;
      });
    });

    expect(thrown).toBeInstanceOf(Error);
  });

  it("does not expose useMutation semantics", () => {
    const { result } = renderHook(() => useCachedGenomeGroupLoader(), {
      wrapper: makeWrapper(),
    });

    const keys = Object.keys(result.current);
    expect(keys).not.toContain("mutate");
    expect(keys).not.toContain("mutateAsync");
    expect(keys).not.toContain("isIdle");
    expect(keys).not.toContain("isPending");
    expect(keys).toContain("load");
    expect(keys).toContain("isLoading");
    expect(keys).toContain("error");
  });
});
