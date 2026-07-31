/**
 * Integration tests for ListData network behaviour.
 *
 * These tests render the component inside a real QueryClient and intercept
 * outbound fetches with MSW so they exercise the actual queryFn / prefetch
 * effect code paths without hitting the BV-BRC API.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
// Pagination loading regression
// ---------------------------------------------------------------------------
// Placeholder rows keep the query in a success state while the next page fetches.
// The table should still show skeletons instead of rendering stale rows as current data.
describe("ListData pagination loading", () => {
  it("shows skeletons instead of stale rows while placeholder page data is fetching", async () => {
    let resolveThirdPage: (() => void) | undefined;

    server.use(
      http.get(`${dataApi}/genome_sequence/`, async ({ request }) => {
        if (request.url.includes("limit(1)")) {
          return HttpResponse.json({ response: { numFound: 1000 } });
        }

        const range = request.headers.get("Range") ?? "";
        if (range === "items=400-600") {
          await new Promise<void>((resolve) => {
            resolveThirdPage = resolve;
          });
          return HttpResponse.json([{ sequence_id: "page-3-sequence", genome_id: "g3", genome_name: "Page 3 Genome" }]);
        }

        if (range === "items=0-200") {
          return HttpResponse.json([{ sequence_id: "page-1-sequence", genome_id: "g1", genome_name: "Page 1 Genome" }]);
        }

        return HttpResponse.json([{ sequence_id: `range-${range}`, genome_id: range, genome_name: `Genome ${range}` }]);
      }),
    );

    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <ListData resource="genome_sequence" q="eq(genome_id,*)" />
      </Wrapper>
    );

    expect(await screen.findByText(/Showing 1-1 of 1000 results/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "3" }));

    await waitFor(() => {
      expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/Showing 401-401 of 1000 results/)).not.toBeInTheDocument();
    expect(screen.getByText(/Showing 401-600 of 1000 results/)).toBeInTheDocument();

    resolveThirdPage?.();

    expect(await screen.findByText(/Showing 401-401 of 1000 results/)).toBeInTheDocument();
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

// ---------------------------------------------------------------------------
// Controlled filter
// ---------------------------------------------------------------------------
// The interactions tab needs table and graph subviews to share one filter, so
// ListData must support a controlled `filter`/`onFilterChange` pair (mirroring
// the existing controlled rowSelection/pageIndex pattern) instead of always
// owning `filter` as internal-only state.
describe("ListData controlled filter", () => {
  it("uses the controlled filter prop to build the fetch query instead of empty internal state", async () => {
    const capturedDataUrls: string[] = [];

    server.use(
      http.get(`${dataApi}/genome_sequence/`, ({ request }) => {
        if (request.url.includes("limit(1)")) {
          return HttpResponse.json({ response: { numFound: 5 } });
        }
        capturedDataUrls.push(request.url);
        return HttpResponse.json([]);
      }),
    );

    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <ListData
          resource="genome_sequence"
          q="eq(genome_id,*)"
          filter="eq(foo,bar)"
          onFilterChange={vi.fn()}
        />
      </Wrapper>
    );

    await waitFor(() => { expect(capturedDataUrls.length).toBeGreaterThan(0); });

    expect(capturedDataUrls[0]).toContain("eq(foo,bar)");
  });

  it("calls onFilterChange instead of applying the new filter itself when controlled", async () => {
    const capturedDataUrls: string[] = [];

    server.use(
      http.get(`${dataApi}/genome_sequence/`, ({ request }) => {
        if (request.url.includes("limit(1)")) {
          return HttpResponse.json({ response: { numFound: 5 } });
        }
        capturedDataUrls.push(request.url);
        return HttpResponse.json([]);
      }),
    );

    const onFilterChange = vi.fn();
    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <ListData
          resource="genome_sequence"
          q="eq(genome_id,*)"
          filter=""
          onFilterChange={onFilterChange}
        />
      </Wrapper>
    );

    const input = screen.getByPlaceholderText("Search keywords...");
    fireEvent.change(input, { target: { value: "abc" } });

    await waitFor(() => { expect(onFilterChange).toHaveBeenCalledWith("keyword(abc*)"); });
    await waitFor(() => { expect(capturedDataUrls.length).toBeGreaterThan(0); });

    // Controlled: the prop is still "" (parent chose not to feed it back), so
    // ListData must not have silently applied the typed keyword itself.
    expect(capturedDataUrls.every((url) => !url.includes("abc"))).toBe(true);
  });

  // The interactions tab's Table subtab needs to stay fully self-managing
  // (own filter, own pagination — required for it to survive tab-switch
  // remounts, see interactions-subview-shell.tsx's `keepMounted`) while still
  // letting the shell observe its current filter to pass read-only into the
  // Graph subtab. That needs a THIRD mode beyond controlled/uncontrolled:
  // onFilterChange provided but `filter` left undefined — internal state
  // still drives ListData's own query, and the parent is notified too.
  it("updates its own query AND notifies onFilterChange when filter is left uncontrolled", async () => {
    const capturedDataUrls: string[] = [];

    server.use(
      http.get(`${dataApi}/genome_sequence/`, ({ request }) => {
        if (request.url.includes("limit(1)")) {
          return HttpResponse.json({ response: { numFound: 5 } });
        }
        capturedDataUrls.push(request.url);
        return HttpResponse.json([]);
      }),
    );

    const onFilterChange = vi.fn();
    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <ListData resource="genome_sequence" q="eq(genome_id,*)" onFilterChange={onFilterChange} />
      </Wrapper>
    );

    const input = screen.getByPlaceholderText("Search keywords...");
    fireEvent.change(input, { target: { value: "abc" } });

    await waitFor(() => { expect(onFilterChange).toHaveBeenCalledWith("keyword(abc*)"); });

    // No `filter` prop fed back (unlike the controlled test above): ListData
    // must apply the typed keyword to its own query anyway.
    await waitFor(() => {
      expect(capturedDataUrls.some((url) => url.includes("abc"))).toBe(true);
    });
  });
});
