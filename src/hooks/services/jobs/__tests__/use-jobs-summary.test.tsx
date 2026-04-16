import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test-helpers/msw-server";
import { ApiCallError } from "@/lib/api/types";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

import { useJobsSummary } from "../use-jobs-summary";

describe("useJobsSummary", () => {
  it("returns summary data on success", async () => {
    const taskSummary = { completed: 10, failed: 2 };
    const appSummary = { GenomeAssembly2: 5, GenomeAnnotation: 7 };

    let capturedBody: unknown;
    server.use(
      http.post("/api/services/app-service/jobs/summary", async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ taskSummary, appSummary });
      }),
    );

    const { result } = renderHook(() => useJobsSummary(false), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ taskSummary, appSummary });
    expect(capturedBody).toEqual(expect.objectContaining({ include_archived: false }));
  });

  it("unwraps array-wrapped summaries", async () => {
    const taskSummary = { completed: 3, running: 1 };
    const appSummary = { Blast: 4 };

    server.use(
      http.post("/api/services/app-service/jobs/summary", () => {
        return HttpResponse.json({
          taskSummary: [taskSummary],
          appSummary: [appSummary],
        });
      }),
    );

    const { result } = renderHook(() => useJobsSummary(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ taskSummary, appSummary });
  });

  it("throws ApiCallError on HTTP error", async () => {
    server.use(
      http.post("/api/services/app-service/jobs/summary", () => {
        return new HttpResponse(null, { status: 502, statusText: "Bad Gateway" });
      }),
    );

    const { result } = renderHook(() => useJobsSummary(false), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(ApiCallError);
    expect(result.current.error?.status).toBe(502);
  });
});
