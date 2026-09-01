import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { DataRepository } from "@/lib/data-api";
import type { CollectionState } from "@/lib/views/collection-state";
import {
  selectedIdsFromSelection,
  useResourceCollection,
} from "../use-resource-collection";

const initialState: CollectionState = {
  filters: {},
  page: 1,
  sort: "genome_name:asc",
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

function repository() {
  return {
    collection: vi.fn().mockResolvedValue({
      rows: [{ genome_id: "100.1", genome_name: "Page value" }],
      total: 2,
      facets: {},
      page: 1,
      pageSize: 200,
    }),
    member: vi.fn().mockResolvedValue({
      row: {
        genome_id: "100.1",
        genome_name: "Projected detail",
        host_name: "Human",
      },
    }),
  } as unknown as DataRepository;
}

describe("selectedIdsFromSelection", () => {
  it("preserves selected IDs across pages", () => {
    expect(selectedIdsFromSelection({ a: true, b: true, stale: true })).toEqual(
      ["a", "b", "stale"],
    );
  });

  it("keeps string identities distinct without numeric coercion", () => {
    expect(selectedIdsFromSelection({ "0012": true, "12": true })).toEqual([
      "12",
      "0012",
    ]);
  });
});

describe("useResourceCollection", () => {
  it("omits repository and table sorting for the unsorted state", async () => {
    const data = repository();
    const collection = vi.spyOn(data, "collection");
    const { result } = renderHook(
      () =>
        useResourceCollection({
          repository: data,
          resource: "serology",
          idField: "id",
          fields: ["id", "sample_identifier"],
          state: { filters: {}, page: 1, sort: "unsorted" },
          onStateChange: vi.fn(),
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });
    expect(collection.mock.calls[0]?.[1].sort).toBeUndefined();
    expect(result.current.sorting).toEqual([]);
  });

  it("preserves selection across paging and sorting, then resets it for a new query", async () => {
    const data = repository();
    const onStateChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ state }: { state: CollectionState }) =>
        useResourceCollection({
          repository: data,
          resource: "genome",
          idField: "genome_id",
          fields: ["genome_id", "genome_name"],
          state,
          onStateChange,
        }),
      { wrapper, initialProps: { state: initialState } },
    );
    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });

    act(() => {
      result.current.setSelection({ "100.1": true });
    });
    rerender({ state: { ...initialState, page: 2 } });
    expect(result.current.selectedIds).toEqual(["100.1"]);

    rerender({ state: { ...initialState, sort: "genome_name:desc" } });
    expect(result.current.selectedIds).toEqual(["100.1"]);

    rerender({ state: { ...initialState, keyword: "new query" } });
    expect(result.current.selectedIds).toEqual([]);
  });

  it("does not prefetch the next page by default", async () => {
    const data = repository();
    const collection = vi.spyOn(data, "collection").mockResolvedValue({
      rows: [{ genome_id: "100.1", genome_name: "Page 1" }],
      total: 401,
      facets: {},
      page: 1,
      pageSize: 200,
    });
    const { result } = renderHook(
      () =>
        useResourceCollection({
          repository: data,
          resource: "genome",
          idField: "genome_id",
          fields: ["genome_id", "genome_name"],
          state: initialState,
          onStateChange: vi.fn(),
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.total).toBe(401);
    });
    expect(collection).toHaveBeenCalledTimes(1);
    expect(collection.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ page: 1 }),
    );
  });

  it("prefetches the next page when enabled but refreshes it during pagination", async () => {
    const data = repository();
    const collection = vi.spyOn(data, "collection").mockImplementation(
      (_resource, request) => Promise.resolve({
        rows: [
          {
            genome_id: `100.${String(request.page ?? 1)}`,
            genome_name: `Page ${String(request.page ?? 1)}`,
          },
        ],
        total: 401,
        facets: {},
        page: request.page ?? 1,
        pageSize: request.pageSize ?? 200,
      }),
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const queryWrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);
    const { result, rerender } = renderHook(
      ({ state }: { state: CollectionState }) =>
        useResourceCollection({
          repository: data,
          resource: "genome",
          idField: "genome_id",
          fields: ["genome_id", "genome_name"],
          prefetchNextPage: true,
          state,
          onStateChange: vi.fn(),
        }),
      { wrapper: queryWrapper, initialProps: { state: initialState } },
    );

    await waitFor(() => {
      expect(collection).toHaveBeenCalledWith(
        "genome",
        expect.objectContaining({ page: 2 }),
        expect.any(AbortSignal),
      );
    });
    rerender({ state: { ...initialState, page: 2 } });
    await waitFor(() => {
      expect(result.current.rows).toEqual([
        { genome_id: "100.2", genome_name: "Page 2" },
      ]);
    });
    expect(
      collection.mock.calls.filter(([, request]) => request.page === 2),
    ).toHaveLength(2);
  });

  it("does not prefetch from a previous query's placeholder total", async () => {
    const data = repository();
    const collection = vi.spyOn(data, "collection");
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const queryWrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);
    const { rerender } = renderHook(
      ({ rql }: { rql?: string }) =>
        useResourceCollection({
          repository: data,
          resource: "serology",
          idField: "id",
          fields: ["id", "sample_identifier"],
          prefetchNextPage: true,
          structuralRql: rql,
          state: { filters: {}, page: 1, sort: "unsorted", keyword: "influenza" },
          onStateChange: vi.fn(),
        }),
      {
        wrapper: queryWrapper,
        initialProps: { rql: undefined as string | undefined },
      },
    );
    await waitFor(() => {
      expect(collection).toHaveBeenCalledWith(
        "serology",
        expect.objectContaining({ keyword: "influenza", page: 1 }),
        expect.any(AbortSignal),
      );
    });

    collection.mockClear();
    rerender({ rql: "keyword(N034)" });

    await waitFor(() => {
      expect(collection).toHaveBeenCalledWith(
        "serology",
        expect.objectContaining({
          keyword: "influenza",
          rql: "keyword(N034)",
          page: 1,
        }),
        expect.any(AbortSignal),
      );
    });
    expect(
      collection.mock.calls.some(
        ([, request]) => request.rql === "keyword(N034)" && request.page === 2,
      ),
    ).toBe(false);
  });

  it("represents all-matching selection without requesting a member detail", async () => {
    const data = repository();
    const member = vi.spyOn(data, "member");
    const { result } = renderHook(
      () =>
        useResourceCollection({
          repository: data,
          resource: "genome",
          idField: "genome_id",
          fields: ["genome_id", "genome_name"],
          state: initialState,
          onStateChange: vi.fn(),
        }),
      { wrapper },
    );
    await waitFor(() => {
      expect(result.current.total).toBe(2);
    });

    act(() => {
      result.current.setSelection({});
      result.current.setIsAllPagesSelected(true);
    });

    expect(result.current.isAllPagesSelected).toBe(true);
    expect(result.current.activeId).toBeNull();
    expect(result.current.selectedIds).toEqual([]);
    expect(member).not.toHaveBeenCalled();
  });

  it("requests the detail projection and replaces the page-row fallback", async () => {
    const data = repository();
    const member = vi.spyOn(data, "member");
    const { result } = renderHook(
      () =>
        useResourceCollection({
          repository: data,
          resource: "genome",
          idField: "genome_id",
          fields: ["genome_id", "genome_name"],
          detailFields: ["genome_id", "genome_name", "host_name"],
          state: initialState,
          onStateChange: vi.fn(),
        }),
      { wrapper },
    );
    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });

    act(() => {
      result.current.setSelection({ "100.1": true });
    });
    expect(result.current.detail).toMatchObject({ genome_name: "Page value" });
    await waitFor(() => {
      expect(result.current.detail).toMatchObject({
        genome_name: "Projected detail",
        host_name: "Human",
      });
    });
    expect(member).toHaveBeenCalledWith(
      "genome",
      {
        id: "100.1",
        idField: "genome_id",
        fields: ["genome_id", "genome_name", "host_name"],
      },
      expect.any(AbortSignal),
    );
  });
});
