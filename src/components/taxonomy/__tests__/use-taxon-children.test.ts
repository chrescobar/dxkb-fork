import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@testing-library/react";

import { server } from "@/test-helpers/msw-server";
import { createQueryClientWrapper } from "@/test-helpers/api-route-helpers";

import { fetchTaxonChildCounts, useTaxonChildren } from "../use-taxon-children";
import type { TaxonRecord } from "../taxon-tree-types";

const dataApi = "https://data.test/api";

function record(id: number, name: string, rank = "species"): TaxonRecord {
  return { taxon_id: id, taxon_name: name, taxon_rank: rank, parent_id: 234, genomes: 5 };
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_DATA_API = dataApi;
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_DATA_API;
});

describe("useTaxonChildren", () => {
  it("fetches a node's children in a single request when they fit one page", async () => {
    const all = Array.from({ length: 30 }, (_, i) => record(1000 + i, `Child ${String(i)}`));
    const seenRanges: string[] = [];

    server.use(
      http.get(`${dataApi}/taxonomy/`, ({ request }) => {
        const range = request.headers.get("Range") ?? "";
        seenRanges.push(range);
        const match = /items=(\d+)-(\d+)/.exec(range);
        const start = match ? Number(match[1]) : 0;
        const end = match ? Number(match[2]) : 50000;
        const slice = all.slice(start, end + 1); // end is inclusive
        return HttpResponse.json(slice, {
          headers: { "Content-Range": `items ${String(start)}-${String(end)}/${String(all.length)}` },
        });
      }),
    );

    const { result } = renderHook(() => useTaxonChildren(234, true), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => { expect(result.current.isSuccess).toBe(true); });
    expect(result.current.data).toHaveLength(30);
    // pageSize (50000) covers all 30 rows → one request, no sequential paging.
    expect(seenRanges).toEqual(["items=0-49999"]);
  });

  it("does not fetch when disabled", () => {
    const handler = vi.fn(() => HttpResponse.json([]));
    server.use(http.get(`${dataApi}/taxonomy/`, handler));

    const { result } = renderHook(() => useTaxonChildren(234, false), {
      wrapper: createQueryClientWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(handler).not.toHaveBeenCalled();
  });

  it("preserves the HTTP status and statusText in the thrown error", async () => {
    server.use(
      http.get(`${dataApi}/taxonomy/`, () =>
        new HttpResponse(null, { status: 503, statusText: "Service Unavailable" }),
      ),
    );

    const { result } = renderHook(() => useTaxonChildren(999, true), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => { expect(result.current.isError).toBe(true); });
    expect(result.current.error?.message).toBe(
      "taxonomy children 999: 503 Service Unavailable",
    );
  });

  it("throws a configuration error when NEXT_PUBLIC_DATA_API is missing", async () => {
    delete process.env.NEXT_PUBLIC_DATA_API;

    const { result } = renderHook(() => useTaxonChildren(234, true), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => { expect(result.current.isError).toBe(true); });
    expect(result.current.error?.message).toBe(
      "NEXT_PUBLIC_DATA_API environment variable is not configured",
    );
  });
});

describe("fetchTaxonChildCounts", () => {
  it("parses the facet_counts header into a parentId → count map", async () => {
    server.use(
      http.get(`${dataApi}/taxonomy/`, () =>
        // Flat [id, count, id, count, …] array, exactly as SOLR returns it.
        new HttpResponse("[]", {
          headers: {
            "Content-Range": "items 0-0/0",
            facet_counts: JSON.stringify({ facet_fields: { parent_id: ["235", 3, "236", 0] } }),
          },
        }),
      ),
    );

    const counts = await fetchTaxonChildCounts([235, 236]);
    expect(counts.get(235)).toBe(3);
    expect(counts.get(236)).toBe(0);
  });

  it("returns an empty map without fetching when given no ids", async () => {
    const handler = vi.fn(() => HttpResponse.json([]));
    server.use(http.get(`${dataApi}/taxonomy/`, handler));

    const counts = await fetchTaxonChildCounts([]);
    expect(counts.size).toBe(0);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns an empty map when the facet_counts header is absent", async () => {
    server.use(
      http.get(`${dataApi}/taxonomy/`, () =>
        new HttpResponse("[]", { headers: { "Content-Range": "items 0-0/0" } }),
      ),
    );

    const counts = await fetchTaxonChildCounts([235]);
    expect(counts.size).toBe(0);
  });

  it("preserves the HTTP status and statusText in the thrown error", async () => {
    server.use(
      http.get(`${dataApi}/taxonomy/`, () =>
        new HttpResponse(null, { status: 500, statusText: "Internal Server Error" }),
      ),
    );

    await expect(fetchTaxonChildCounts([235])).rejects.toThrow(
      "taxonomy child counts: 500 Internal Server Error",
    );
  });
});
