/**
 * Integration tests for ListData network behaviour with resource="serology".
 *
 * These tests render the component inside a real QueryClient and intercept
 * outbound fetches with MSW so they exercise the actual queryFn / prefetch
 * effect code paths without hitting the BV-BRC API.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import React from "react";

import { server } from "@/test-helpers/msw-server";
import { ListData } from "../list-data";

const dataApi = "https://test-bvbrc-api.example.com";

const serologyRow = {
  id: "sero-1",
  sample_identifier: "923",
  host_common_name: "Domestic Cat",
  test_type: "ELISA/IDEXX Flu Ab",
  test_result: "Negative",
  collection_date: "2008-11-02T16:54:39Z",
};

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

describe("ListData serology", () => {
  it("renders serology rows for the taxon query", async () => {
    server.use(
      http.get(`${dataApi}/serology/`, ({ request }) => {
        if (request.url.includes("limit(1)")) {
          return HttpResponse.json({ response: { numFound: 1 } });
        }
        return HttpResponse.json([serologyRow]);
      }),
    );

    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <ListData resource="serology" q="eq(taxon_lineage_ids,2955291)" />
      </Wrapper>
    );

    // Footer row-count proves the count + page-data fetches both resolved.
    // Cell values aren't asserted: the table virtualizes rows/columns, so in
    // jsdom (zero-dimension viewport) cell text isn't reliably rendered — the
    // sibling integration test asserts on the footer for the same reason.
    expect(await screen.findByText(/Showing 1-1 of 1 results/)).toBeInTheDocument();
  });

  it("sends limit(1) on the count request", async () => {
    const countUrls: string[] = [];

    server.use(
      http.get(`${dataApi}/serology/`, ({ request }) => {
        if (request.url.includes("limit(1)")) {
          countUrls.push(request.url);
          return HttpResponse.json({ response: { numFound: 1 } });
        }
        return HttpResponse.json([serologyRow]);
      }),
    );

    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <ListData resource="serology" q="eq(taxon_lineage_ids,2955291)" />
      </Wrapper>
    );

    await waitFor(() => { expect(countUrls.length).toBeGreaterThan(0); });

    expect(countUrls[0]).toContain("limit(1)");
    expect(countUrls[0]).toContain("serology");
  });

  // ---------------------------------------------------------------------------
  // Select-clause regression
  // ---------------------------------------------------------------------------
  // serologyFields declares `date_modified` under the field id `date_modified`
  // and `date_added` under the field id `date_inserted` — there is no
  // `date_updated` field. The select() clause is built from the field ids, so
  // it must never reference the dead `date_updated` name.
  it("select() clause uses date_modified not the dead date_updated field", async () => {
    const capturedDataUrls: string[] = [];

    server.use(
      http.get(`${dataApi}/serology/`, ({ request }) => {
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
        <ListData resource="serology" q="eq(taxon_lineage_ids,2955291)" />
      </Wrapper>
    );

    await waitFor(() => { expect(capturedDataUrls.length).toBeGreaterThan(0); });

    const selectMatch = (capturedDataUrls[0] ?? "").match(/&select\(([^)]+)\)/);
    const selectedFields = (selectMatch?.[1] ?? "").split(",");

    expect(selectedFields).toContain("date_modified");
    expect(selectedFields).not.toContain("date_updated");
    expect(selectedFields).toContain("date_inserted");
  });
});
