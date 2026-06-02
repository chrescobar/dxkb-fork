import { http, HttpResponse } from "msw";

import { fetchOrganismGenera } from "@/lib/services/organisms/genera";
import { server } from "@/test-helpers/msw-server";

const baseUrl = "https://bvbrc.test/api-for-website";

beforeEach(() => {
  process.env.BVBRC_WEBSITE_API_URL = baseUrl;
});

afterEach(() => {
  delete process.env.BVBRC_WEBSITE_API_URL;
});

describe("fetchOrganismGenera", () => {
  it("requests the SOLR genus facet and parses flat facet fields", async () => {
    const capturedAccepts: string[] = [];
    const capturedUrls: string[] = [];
    server.use(
      http.get(`${baseUrl}/genome/`, ({ request }) => {
        capturedAccepts.push(request.headers.get("accept") ?? "");
        capturedUrls.push(request.url);
        return HttpResponse.json({
          response: { numFound: 123 },
          facet_counts: {
            facet_fields: {
              genus: ["Escherichia", 20, "Klebsiella", 10],
            },
          },
        });
      }),
    );

    await expect(fetchOrganismGenera(2, 24)).resolves.toEqual([
      { name: "Escherichia", count: 20 },
      { name: "Klebsiella", count: 10 },
    ]);
    expect(capturedAccepts).toEqual(["application/solr+json"]);
    expect(capturedUrls[0]).toContain("eq(taxon_lineage_ids,2)");
    expect(capturedUrls[0]).toContain("facet((field,genus),(limit,24),(mincount,1))");
  });

  it("throws on malformed SOLR facet shape", async () => {
    server.use(
      http.get(`${baseUrl}/genome/`, () => HttpResponse.json({ response: { numFound: 123 } })),
    );

    await expect(fetchOrganismGenera(2)).rejects.toThrow("facet_counts");
  });
});
