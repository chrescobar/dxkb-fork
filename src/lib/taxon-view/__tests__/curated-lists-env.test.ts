describe("getCuratedLists — env-var override", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.TAXON_VIEW_POLICY_JSON;
  });

  it("returns committed defaults when TAXON_VIEW_POLICY_JSON is unset", async () => {
    const { getCuratedLists } = await import("../curated-lists");
    const lists = getCuratedLists();
    expect(lists.sfvtTaxonIds.has(12637)).toBe(true); // Dengue seed
    expect(lists.surveillanceLineageNames.has("Alphainfluenzavirus influenzae")).toBe(true);
  });

  it("uses env-var values when TAXON_VIEW_POLICY_JSON is set", async () => {
    process.env.TAXON_VIEW_POLICY_JSON = JSON.stringify({
      sfvtTaxonIds: [99999],
      surveillanceLineageNames: ["Custom pathogen"],
      serologyLineageNames: ["Custom pathogen"],
    });
    const { getCuratedLists } = await import("../curated-lists");
    const lists = getCuratedLists();
    expect(lists.sfvtTaxonIds.has(99999)).toBe(true);
    expect(lists.sfvtTaxonIds.has(12637)).toBe(false); // not in override
    expect(lists.surveillanceLineageNames.has("Custom pathogen")).toBe(true);
  });

  it("falls back to defaults on malformed TAXON_VIEW_POLICY_JSON (logs, does not throw)", async () => {
    process.env.TAXON_VIEW_POLICY_JSON = "{{not valid json";
    const { getCuratedLists } = await import("../curated-lists");
    expect(() => getCuratedLists()).not.toThrow();
    const lists = getCuratedLists();
    expect(lists.sfvtTaxonIds.has(12637)).toBe(true); // committed default preserved
  });

  it("merges partial override — omitted keys fall back to defaults", async () => {
    process.env.TAXON_VIEW_POLICY_JSON = JSON.stringify({
      sfvtTaxonIds: [77777],
    });
    const { getCuratedLists } = await import("../curated-lists");
    const lists = getCuratedLists();
    expect(lists.sfvtTaxonIds.has(77777)).toBe(true);
    expect(lists.surveillanceLineageNames.has("Alphainfluenzavirus influenzae")).toBe(true);
  });

  it("ignores a present-but-wrong-typed key (non-array) and keeps that key's default", async () => {
    // Operator typo: a bare string instead of an array. Without the Array.isArray
    // guard this becomes new Set("12637") = {"1","2","6","3","7"} and the numeric
    // gate never matches. The guard must fall back to the committed default.
    process.env.TAXON_VIEW_POLICY_JSON = JSON.stringify({ sfvtTaxonIds: "12637" });
    const { getCuratedLists } = await import("../curated-lists");
    const lists = getCuratedLists();
    expect(lists.sfvtTaxonIds.has(12637)).toBe(true); // default preserved
    expect(lists.sfvtTaxonIds.has("1" as never)).toBe(false); // not split into chars
  });
});
