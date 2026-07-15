/**
 * Integration tests for ListData network behaviour.
 *
 * These tests render the component inside a real QueryClient and intercept
 * outbound fetches with MSW so they exercise the actual queryFn / prefetch
 * effect code paths without hitting the BV-BRC API.
 */
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import React from "react";

import { server } from "@/test-helpers/msw-server";
import { ListData } from "../list-data";

const dataApi = "https://test-bvbrc-api.example.com";

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };
});

beforeEach(() => {
  process.env.NEXT_PUBLIC_DATA_API = dataApi;
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_DATA_API;
});

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return { queryClient, Wrapper };
}

// ---------------------------------------------------------------------------
// Select-clause regression
// ---------------------------------------------------------------------------
// The BV-BRC genome_sequence endpoint returns the raw `sequence` DNA field by
// default, inflating each page response from ~80KB to ~18MB. The fix adds a
// &select(field1,field2,...) clause that restricts returned fields to those in
// genomeSequenceFields — which excludes `sequence`.
describe("ListData select clause", () => {
  it("includes &select() in the data fetch URL for genome_sequence", async () => {
    const capturedDataUrls: string[] = [];

    server.use(
      http.get(`${dataApi}/genome_sequence/`, ({ request }) => {
        if (request.url.includes("limit(1)")) {
          return HttpResponse.json({ response: { numFound: 500 } });
        }
        capturedDataUrls.push(request.url);
        return HttpResponse.json([]);
      }),
    );

    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <ListData resource="genome_sequence" q="eq(genome_id,*)" />
      </Wrapper>
    );

    await waitFor(() =>
      { expect(capturedDataUrls.length).toBeGreaterThan(0); }
    );

    const dataUrl = capturedDataUrls[0];
    expect(dataUrl).toBeDefined();
    expect(dataUrl).toContain("&select(");
  });

  it("select() clause contains required genome_sequence field ids", async () => {
    const capturedDataUrls: string[] = [];

    server.use(
      http.get(`${dataApi}/genome_sequence/`, ({ request }) => {
        if (request.url.includes("limit(1)")) {
          return HttpResponse.json({ response: { numFound: 500 } });
        }
        capturedDataUrls.push(request.url);
        return HttpResponse.json([]);
      }),
    );

    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <ListData resource="genome_sequence" q="eq(genome_id,*)" />
      </Wrapper>
    );

    await waitFor(() => { expect(capturedDataUrls.length).toBeGreaterThan(0); });

    const dataUrl = capturedDataUrls[0] ?? "";
    const selectMatch = dataUrl.match(/&select\(([^)]+)\)/);
    expect(selectMatch).toBeTruthy();
    const selectedFields = (selectMatch?.[1] ?? "").split(",");

    // Raw DNA field excluded — prevents 18MB responses
    expect(selectedFields).not.toContain("sequence");

    // Core table fields present
    expect(selectedFields).toContain("sequence_id");
    expect(selectedFields).toContain("genome_id");
    expect(selectedFields).toContain("accession");
    expect(selectedFields).toContain("gc_content");
    expect(selectedFields).toContain("length");
  });
});

// ---------------------------------------------------------------------------
// Prefetch regression
// ---------------------------------------------------------------------------
// After page 1 data lands, the prefetch effect fires page 2 (and page 0) in
// the background. Subsequent Next/Prev clicks then hit the TQ cache instantly.
describe("ListData prefetch", () => {
  it("fires a prefetch for the next page after the initial page loads", async () => {
    const capturedRanges: string[] = [];

    server.use(
      http.get(`${dataApi}/genome_sequence/`, ({ request }) => {
        if (request.url.includes("limit(1)")) {
          return HttpResponse.json({ response: { numFound: 1000 } });
        }
        const range = request.headers.get("Range") ?? "";
        capturedRanges.push(range);
        return HttpResponse.json([]);
      }),
    );

    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <ListData resource="genome_sequence" q="eq(genome_id,*)" />
      </Wrapper>
    );

    // Both the page-1 fetch and the page-2 prefetch should complete
    await waitFor(
      () => { expect(capturedRanges).toContain("items=200-400"); },
      { timeout: 4000 }
    );

    expect(capturedRanges).toContain("items=0-200");   // page 1
    expect(capturedRanges).toContain("items=200-400"); // page 2 prefetch
  });

  it("does not prefetch when totalItems is 0 (empty result set)", async () => {
    const capturedRanges: string[] = [];

    server.use(
      http.get(`${dataApi}/genome_sequence/`, ({ request }) => {
        if (request.url.includes("limit(1)")) {
          return HttpResponse.json({ response: { numFound: 0 } });
        }
        const range = request.headers.get("Range") ?? "";
        capturedRanges.push(range);
        return HttpResponse.json([]);
      }),
    );

    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <ListData resource="genome_sequence" q="eq(genome_id,*)" />
      </Wrapper>
    );

    // Give the prefetch effect time to fire if it incorrectly did so
    await new Promise(r => setTimeout(r, 300));

    // No data fetches should have fired — totalItems=0 disables the query
    expect(capturedRanges).toHaveLength(0);
  });
});
