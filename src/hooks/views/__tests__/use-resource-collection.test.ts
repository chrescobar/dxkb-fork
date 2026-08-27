/* eslint-disable @typescript-eslint/unbound-method */
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

  it("represents all-matching selection without requesting a member detail", async () => {
    const data = repository();
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
    expect(data.member).not.toHaveBeenCalled();
  });

  it("requests the detail projection and replaces the page-row fallback", async () => {
    const data = repository();
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
    expect(data.member).toHaveBeenCalledWith(
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
