import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test-helpers/msw-server";
import React from "react";
import { useApiQuery, useApiMutation } from "../hooks";
import { apiCall, apiGet } from "../client";
import { ApiCallError } from "../types";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

describe("useApiQuery", () => {
  it("fetches data and returns typed result", async () => {
    server.use(
      http.get("/api/items", () => {
        return HttpResponse.json({ items: [{ id: 1 }] });
      }),
    );

    const { result } = renderHook(
      () =>
        useApiQuery({
          queryKey: ["items"],
          queryFn: () => apiGet<{ items: { id: number }[] }>("/api/items"),
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ items: [{ id: 1 }] });
  });

  it("sets error as ApiCallError on failure", async () => {
    server.use(
      http.get("/api/items", () => {
        return HttpResponse.json({ error: "Forbidden" }, { status: 403 });
      }),
    );

    const { result } = renderHook(
      () =>
        useApiQuery({
          queryKey: ["items-fail"],
          queryFn: () => apiGet<unknown>("/api/items"),
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiCallError);
    expect((result.current.error as ApiCallError).code).toBe("forbidden");
  });
});

describe("useApiMutation", () => {
  it("calls mutationFn and returns data", async () => {
    server.use(
      http.post("/api/submit", async ({ request }) => {
        const body = (await request.json()) as { name: string };
        return HttpResponse.json({ id: 1, name: body.name });
      }),
    );

    const { result } = renderHook(
      () =>
        useApiMutation({
          mutationFn: (vars: { name: string }) =>
            apiCall<{ id: number; name: string }>("/api/submit", vars),
        }),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ name: "test" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: 1, name: "test" });
  });
});
