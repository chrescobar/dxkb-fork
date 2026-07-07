import { http, HttpResponse } from "msw";
import { server } from "@/test-helpers/msw-server";

import { fetchTaxonChildCounts } from "../use-taxon-children";

const dataApi = "https://data.test/api";

beforeEach(() => {
  process.env.NEXT_PUBLIC_DATA_API = dataApi;
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_DATA_API;
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
