import { http, HttpResponse } from "msw";

import { fetchOrganismTaxonomy } from "@/lib/services/organisms/taxonomy";
import { server } from "@/test-helpers/msw-server";

const baseUrl = "https://bvbrc.test/api-for-website";

beforeEach(() => {
  process.env.BVBRC_WEBSITE_API_URL = baseUrl;
});

afterEach(() => {
  delete process.env.BVBRC_WEBSITE_API_URL;
});

describe("fetchOrganismTaxonomy", () => {
  it("returns normalized taxonomy header data", async () => {
    server.use(
      http.get(`${baseUrl}/taxonomy/2`, () =>
        HttpResponse.json({
          taxon_id: 2,
          taxon_name: "Bacteria",
          lineage_names: ["cellular organisms", "Bacteria"],
          taxon_rank: "superkingdom",
          genomes: 99,
        }),
      ),
    );

    await expect(fetchOrganismTaxonomy(2)).resolves.toEqual({
      taxonId: 2,
      taxonName: "Bacteria",
      lineageNames: ["cellular organisms", "Bacteria"],
      lineageIds: [],
      taxonRank: "superkingdom",
      genomes: 99,
    });
  });

  it("preserves upstream error text", async () => {
    server.use(
      http.get(`${baseUrl}/taxonomy/2`, () =>
        HttpResponse.text("taxonomy unavailable", { status: 500 }),
      ),
    );

    await expect(fetchOrganismTaxonomy(2)).rejects.toThrow("taxonomy unavailable");
  });

  it("parses numeric lineage_ids returned as numbers", async () => {
    server.use(
      http.get(`${baseUrl}/taxonomy/234`, () =>
        HttpResponse.json({
          taxon_id: 234,
          taxon_name: "Brucella",
          lineage_names: ["cellular organisms", "Bacteria", "Brucella"],
          lineage_ids: [131567, 2, 234],
          taxon_rank: "genus",
          genomes: 1909,
        }),
      ),
    );

    const result = await fetchOrganismTaxonomy(234);
    expect(result.lineageIds).toEqual([131567, 2, 234]);
  });

  it("coerces string lineage_ids to numbers (application/solr+json shape)", async () => {
    server.use(
      http.get(`${baseUrl}/taxonomy/234`, () =>
        HttpResponse.json({
          taxon_id: 234,
          taxon_name: "Brucella",
          lineage_names: ["Bacteria", "Brucella"],
          lineage_ids: ["2", "234"],
          taxon_rank: "genus",
          genomes: 1909,
        }),
      ),
    );

    const result = await fetchOrganismTaxonomy(234);
    expect(result.lineageIds).toEqual([2, 234]);
  });

  it("drops non-numeric lineage_ids entries", async () => {
    server.use(
      http.get(`${baseUrl}/taxonomy/234`, () =>
        HttpResponse.json({
          taxon_id: 234,
          taxon_name: "Brucella",
          lineage_names: ["Bacteria", "Brucella"],
          lineage_ids: [2, "not-a-number", null, 234],
          taxon_rank: "genus",
          genomes: 1909,
        }),
      ),
    );

    const result = await fetchOrganismTaxonomy(234);
    expect(result.lineageIds).toEqual([2, 234]);
  });
});
