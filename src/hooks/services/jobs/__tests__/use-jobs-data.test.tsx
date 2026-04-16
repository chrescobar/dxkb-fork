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

import { useJobsData } from "../use-jobs-data";

const defaultParams = {
  offset: 0,
  limit: 25,
  includeArchived: false,
  sortField: "submit_time",
  sortOrder: "desc" as const,
};

describe("useJobsData", () => {
  it("returns jobs data on success", async () => {
    const jobs = [
      { id: "job-1", app: "GenomeAssembly2", status: "completed" },
      { id: "job-2", app: "GenomeAnnotation", status: "queued" },
    ];

    let capturedBody: unknown;
    server.use(
      http.post("/api/services/app-service/jobs/enumerate-tasks-filtered", async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ jobs, totalTasks: 42 });
      }),
    );

    const { result } = renderHook(() => useJobsData(defaultParams), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ jobs, totalTasks: 42 });
    expect(capturedBody).toEqual(
      expect.objectContaining({
        offset: 0,
        limit: 25,
        include_archived: false,
        sort_field: "submit_time",
        sort_order: "desc",
      }),
    );
  });

  it("unwraps nested array when raw[0] is an array", async () => {
    const jobs = [
      { id: "job-1", app: "GenomeAssembly2", status: "completed" },
    ];

    server.use(
      http.post("/api/services/app-service/jobs/enumerate-tasks-filtered", () => {
        return HttpResponse.json({ jobs: [jobs], totalTasks: 10 });
      }),
    );

    const { result } = renderHook(() => useJobsData(defaultParams), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ jobs, totalTasks: 10 });
  });

  it("throws ApiCallError on HTTP error", async () => {
    server.use(
      http.post("/api/services/app-service/jobs/enumerate-tasks-filtered", () => {
        return new HttpResponse(null, { status: 500, statusText: "Internal Server Error" });
      }),
    );

    const { result } = renderHook(() => useJobsData(defaultParams), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(ApiCallError);
    expect(result.current.error?.status).toBe(500);
  });
});
