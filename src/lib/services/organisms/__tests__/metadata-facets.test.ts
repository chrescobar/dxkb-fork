import { http, HttpResponse } from "msw";

import { fetchOrganismMetadataFacets } from "@/lib/services/organisms/metadata-facets";
import { server } from "@/test-helpers/msw-server";

const baseUrl = "https://bvbrc.test/api-for-website";

beforeEach(() => {
  process.env.BVBRC_WEBSITE_API_URL = baseUrl;
});

afterEach(() => {
  delete process.env.BVBRC_WEBSITE_API_URL;
});

function facet(field: string, values: (string | number)[]) {
  return {
    response: { numFound: 10 },
    facet_counts: {
      facet_fields: {
        [field]: values,
      },
    },
  };
}

describe("fetchOrganismMetadataFacets", () => {
  it("fetches requested fields in parallel and returns a field map", async () => {
    server.use(
      http.get(`${baseUrl}/genome/`, ({ request }) => {
        const url = new URL(request.url);
        const query = url.search;
        if (query.includes("(field,genus)")) {
          return HttpResponse.json(facet("genus", ["Escherichia", 20]));
        }
        if (query.includes("(field,host_name)")) {
          return HttpResponse.json(facet("host_name", ["Homo sapiens", 12]));
        }
        return HttpResponse.text("unknown field", { status: 400 });
      }),
    );

    await expect(
      fetchOrganismMetadataFacets(2, ["genus", "host_name"], { limit: 5 }),
    ).resolves.toEqual({
      genus: [{ name: "Escherichia", count: 20 }],
      host_name: [{ name: "Homo sapiens", count: 12 }],
    });
  });

  it("throws the original message when one field fails", async () => {
    server.use(
      http.get(`${baseUrl}/genome/`, ({ request }) => {
        if (new URL(request.url).search.includes("(field,genus)")) {
          return HttpResponse.json(facet("genus", ["Escherichia", 20]));
        }
        return HttpResponse.text("host facet failed", { status: 502 });
      }),
    );

    await expect(
      fetchOrganismMetadataFacets(2, ["genus", "host_name"]),
    ).rejects.toThrow("host facet failed");
  });
});
