import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { server } from "@/test-helpers/msw-server";
import { createQueryClientWrapper } from "@/test-helpers/api-route-helpers";

import { useInteractions } from "../use-interactions";

const dataApi = "https://data.example.test/api";

describe("useInteractions", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DATA_API = dataApi;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_DATA_API;
  });

  it("fetches rows with the range headers and strips any #-fragment from q", async () => {
    let capturedUrl = "";
    let capturedRange: string | null = null;
    server.use(
      http.get(`${dataApi}/ppi/`, ({ request }) => {
        capturedUrl = request.url;
        capturedRange = request.headers.get("Range");
        return HttpResponse.json([{ id: "ppi-1", interactor_a: "A", interactor_b: "B" }]);
      }),
    );

    const { result } = renderHook(() => useInteractions(234, "eq(evidence,experimental)#view_tab=interactions"), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

    expect(capturedUrl).toContain("eq(evidence,experimental)");
    expect(capturedUrl).not.toContain("view_tab");
    expect(capturedRange).toBe("items=0-5000");
    expect(result.current.data).toEqual([{ id: "ppi-1", interactor_a: "A", interactor_b: "B" }]);
  });

  it("throws with the real status and status text when the response is not ok", async () => {
    server.use(
      http.get(`${dataApi}/ppi/`, () => HttpResponse.json({ message: "nope" }, { status: 503, statusText: "Service Unavailable" })),
    );

    const { result } = renderHook(() => useInteractions(234, "eq(evidence,experimental)"), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => { expect(result.current.isError).toBe(true); });

    expect(result.current.error?.message).toContain("503");
  });

  it("returns an empty array when the API returns no rows", async () => {
    server.use(http.get(`${dataApi}/ppi/`, () => HttpResponse.json([])));

    const { result } = renderHook(() => useInteractions(234, "eq(evidence,experimental)"), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

    expect(result.current.data).toEqual([]);
  });

  it("throws a configuration error when NEXT_PUBLIC_DATA_API is not set", () => {
    delete process.env.NEXT_PUBLIC_DATA_API;

    expect(() => {
      renderHook(() => useInteractions(234, "eq(evidence,experimental)"), {
        wrapper: createQueryClientWrapper(),
      });
    }).toThrow("NEXT_PUBLIC_DATA_API environment variable is not configured");
  });
});
