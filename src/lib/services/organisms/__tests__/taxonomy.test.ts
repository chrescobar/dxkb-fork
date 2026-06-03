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
});
