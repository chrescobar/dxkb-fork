import { http, HttpResponse } from "msw";
import { server } from "@/test-helpers/msw-server";

import {
  fetchTaxonChildCounts,
  fetchTaxonChildren,
} from "../use-taxon-children";

const dataApi = "https://data.test/api";

beforeEach(() => {
  process.env.NEXT_PUBLIC_DATA_API = dataApi;
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_DATA_API;
});

describe("fetchTaxonChildren", () => {
  it("stitches multiple pages into one array", async () => {
    let callCount = 0;
    server.use(
      http.get(`${dataApi}/taxonomy/`, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json(
            [
              { taxon_id: 1, taxon_name: "Alpha", taxon_rank: "genus" },
              { taxon_id: 2, taxon_name: "Beta", taxon_rank: "genus" },
            ],
            { headers: { "Content-Range": "items 0-1/3" } },
          );
        }
        return HttpResponse.json(
          [{ taxon_id: 3, taxon_name: "Gamma", taxon_rank: "genus" }],
          { headers: { "Content-Range": "items 2-2/3" } },
        );
      }),
    );

    const children = await fetchTaxonChildren(235);
    expect(children).toHaveLength(3);
    expect(callCount).toBe(2);
    expect(children.map((c) => c.taxon_id)).toEqual([1, 2, 3]);
  });

  it("stops early when a page returns zero items (safety net)", async () => {
    let callCount = 0;
    server.use(
      http.get(`${dataApi}/taxonomy/`, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json(
            [{ taxon_id: 1, taxon_name: "Alpha", taxon_rank: "genus" }],
            // total claims 5 but subsequent page returns nothing
            { headers: { "Content-Range": "items 0-0/5" } },
          );
        }
        return HttpResponse.json([], {
          headers: { "Content-Range": "items 1-0/5" },
        });
      }),
    );

    const children = await fetchTaxonChildren(235);
    expect(children).toHaveLength(1);
    expect(callCount).toBe(2);
  });

  it("throws with status and statusText on HTTP error", async () => {
    server.use(
      http.get(
        `${dataApi}/taxonomy/`,
        () =>
          new HttpResponse(null, {
            status: 503,
            statusText: "Service Unavailable",
          }),
      ),
    );

    await expect(fetchTaxonChildren(235)).rejects.toThrow(
      "taxonomy children 235: 503 Service Unavailable",
    );
  });

  it("throws when NEXT_PUBLIC_DATA_API is not set", async () => {
    delete process.env.NEXT_PUBLIC_DATA_API;
    await expect(fetchTaxonChildren(235)).rejects.toThrow(
      "NEXT_PUBLIC_DATA_API environment variable is not configured",
    );
  });
});

describe("fetchTaxonChildCounts", () => {
  it("parses the facet_counts header into a parentId -> count map", async () => {
    server.use(
      http.get(
        `${dataApi}/taxonomy/`,
        () =>
          // Flat [id, count, id, count, …] array, exactly as SOLR returns it.
          new HttpResponse("[]", {
            headers: {
              "Content-Range": "items 0-0/0",
              facet_counts: JSON.stringify({
                facet_fields: { parent_id: ["235", 3, "236", 0] },
              }),
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

  it("throws when the facet_counts header is absent", async () => {
    server.use(
      http.get(
        `${dataApi}/taxonomy/`,
        () =>
          new HttpResponse("[]", {
            headers: { "Content-Range": "items 0-0/0" },
          }),
      ),
    );

    await expect(fetchTaxonChildCounts([235])).rejects.toThrow(
      "taxonomy child counts: missing facet_counts header",
    );
  });

  it.each([
    ["invalid JSON", "not-json", "invalid facet_counts JSON"],
    [
      "missing parent_id facet",
      JSON.stringify({ facet_fields: {} }),
      "missing facet_fields.parent_id",
    ],
    [
      "odd pair list",
      JSON.stringify({ facet_fields: { parent_id: ["235"] } }),
      "expected parent/count pairs",
    ],
    [
      "invalid parent id",
      JSON.stringify({ facet_fields: { parent_id: ["not-an-id", 1] } }),
      "invalid parent id",
    ],
    [
      "invalid count",
      JSON.stringify({ facet_fields: { parent_id: ["235", -1] } }),
      "invalid child count",
    ],
    [
      "non-primitive parent id",
      JSON.stringify({ facet_fields: { parent_id: [[], 1] } }),
      "invalid parent id",
    ],
    [
      "boolean count",
      JSON.stringify({ facet_fields: { parent_id: ["235", true] } }),
      "invalid child count",
    ],
    [
      "empty parent id",
      JSON.stringify({ facet_fields: { parent_id: ["", 1] } }),
      "invalid parent id",
    ],
    [
      "null count",
      JSON.stringify({ facet_fields: { parent_id: ["235", null] } }),
      "invalid child count",
    ],
    [
      "unexpected parent",
      JSON.stringify({ facet_fields: { parent_id: ["999", 1] } }),
      "unexpected parent id 999",
    ],
    [
      "duplicate parent",
      JSON.stringify({ facet_fields: { parent_id: ["235", 1, "235", 2] } }),
      "duplicate parent id 235",
    ],
  ])("throws for %s", async (_case, facetCounts, expected) => {
    server.use(
      http.get(
        `${dataApi}/taxonomy/`,
        () =>
          new HttpResponse("[]", { headers: { facet_counts: facetCounts } }),
      ),
    );

    await expect(fetchTaxonChildCounts([235])).rejects.toThrow(expected);
  });

  it("preserves the HTTP status and statusText in the thrown error", async () => {
    server.use(
      http.get(
        `${dataApi}/taxonomy/`,
        () =>
          new HttpResponse(null, {
            status: 500,
            statusText: "Internal Server Error",
          }),
      ),
    );

    await expect(fetchTaxonChildCounts([235])).rejects.toThrow(
      "taxonomy child counts: 500 Internal Server Error",
    );
  });
});
