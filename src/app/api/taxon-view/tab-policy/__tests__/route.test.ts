import { GET } from "../route";

describe("GET /api/taxon-view/tab-policy", () => {
  afterEach(() => {
    delete process.env.TAXON_VIEW_POLICY_JSON;
  });

  it("returns 200 with JSON-serializable curated lists shape", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      sfvtTaxonIds: number[];
      surveillanceLineageNames: string[];
      serologyLineageNames: string[];
    };
    expect(Array.isArray(body.sfvtTaxonIds)).toBe(true);
    expect(body.sfvtTaxonIds).toContain(12637);
    expect(Array.isArray(body.surveillanceLineageNames)).toBe(true);
    expect(body.surveillanceLineageNames).toContain("Alphainfluenzavirus influenzae");
    expect(Array.isArray(body.serologyLineageNames)).toBe(true);
  });
});
