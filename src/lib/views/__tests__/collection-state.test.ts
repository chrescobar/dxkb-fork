import {
  canonicalizeCollectionSearchParams,
  canonicalizeCollectionState,
  collectionStateToRql,
  parseCollectionState,
  serializeCollectionState,
  updateCollectionSearchParams,
  type CollectionStateOptions,
} from "../collection-state";

const options = {
  defaultSort: "relevance",
  sortAllowlist: ["relevance", "name", "date"] as const,
  friendlyFilters: ["taxon_id", "host"] as const,
  filterFieldMap: { taxon_id: "taxon_lineage_ids" },
} satisfies CollectionStateOptions<"relevance" | "name" | "date">;

describe("collection URL state", () => {
  it("parses one-based paging and canonical defaults", () => {
    expect(parseCollectionState({}, options)).toEqual({
      keyword: undefined,
      rql: undefined,
      filters: {},
      page: 1,
      sort: "relevance",
    });
    expect(
      parseCollectionState({ page: "3", sort: "name" }, options),
    ).toMatchObject({
      page: 3,
      sort: "name",
    });
  });

  it.each(["0", "-1", "1.5", "01", "abc", "9007199254740992"])(
    "canonicalizes invalid page %s to page 1",
    (page) => {
      expect(parseCollectionState({ page }, options).page).toBe(1);
    },
  );

  it("canonicalizes repeated pages and invalid sorts to defaults", () => {
    expect(parseCollectionState({ page: ["1", "2"] }, options).page).toBe(1);
    expect(parseCollectionState({ sort: "score desc" }, options).sort).toBe(
      "relevance",
    );
    expect(
      canonicalizeCollectionSearchParams(
        { page: ["1", "2"], sort: "score desc", keep: "yes" },
        options,
      ).toString(),
    ).toBe("keep=yes");
  });

  it("keeps keyword independent and gives explicit rql precedence over friendly filters", () => {
    const state = parseCollectionState(
      { keyword: "influenza", rql: "eq(public,true)", taxon_id: "11520" },
      options,
    );
    expect(state.keyword).toBe("influenza");
    expect(state.rql).toBe("eq(public,true)");
    expect(state.filters).toEqual({});
    expect(collectionStateToRql(state, options)).toBe("eq(public,true)");
  });

  it("preserves explicitly independent filters alongside rql", () => {
    const independentOptions = {
      ...options,
      friendlyFilters: [...options.friendlyFilters, "filter"],
      independentFilters: ["filter"],
    } satisfies CollectionStateOptions;
    const state = parseCollectionState(
      { rql: "eq(public,true)", taxon_id: "2", filter: "protein" },
      independentOptions,
    );
    expect(state.filters).toEqual({ filter: ["protein"] });
    expect(serializeCollectionState(state, independentOptions).toString()).toBe(
      "rql=eq%28public%2Ctrue%29&filter=protein",
    );
  });

  it("canonicalizes an opted-in legacy RQL filter", () => {
    const legacyOptions = {
      ...options,
      legacyRqlFilter: true,
    } satisfies CollectionStateOptions;
    const state = parseCollectionState(
      { filter: "eq(public,true)" },
      legacyOptions,
    );

    expect(state.rql).toBe("eq(public,true)");
    expect(
      parseCollectionState(
        { rql: "eq(public,false)", filter: "eq(public,true)" },
        legacyOptions,
      ).rql,
    ).toBe("eq(public,false)");
    expect(
      canonicalizeCollectionSearchParams(
        { filter: "eq(public,true)" },
        legacyOptions,
      ).toString(),
    ).toBe("rql=eq%28public%2Ctrue%29");
  });

  it("maps multi-value friendly fields using OR within a field and AND across fields", () => {
    const state = parseCollectionState(
      { keyword: "coli", taxon_id: "2", host: ["human", "swine"] },
      options,
    );
    expect(collectionStateToRql(state, options)).toBe(
      "and(eq(taxon_lineage_ids,2),or(eq(host,human),eq(host,swine)))",
    );
    expect(collectionStateToRql(state, options)).not.toContain("keyword");
    expect(serializeCollectionState(state, options).getAll("host")).toEqual([
      "human",
      "swine",
    ]);
  });

  it("deduplicates and serializes repeated facet values", () => {
    const state = parseCollectionState(
      { host: ["human", "swine", "human"] },
      options,
    );
    expect(state.filters).toEqual({ host: ["human", "swine"] });
    expect(serializeCollectionState(state, options).getAll("host")).toEqual([
      "human",
      "swine",
    ]);
  });

  it("serializes a refinement independently from the primary keyword", () => {
    const state = parseCollectionState(
      { keyword: "influenza", refine: "N034" },
      options,
    );

    expect(state).toMatchObject({ keyword: "influenza", refine: "N034" });
    expect(serializeCollectionState(state, options).toString()).toBe(
      "keyword=influenza&refine=N034",
    );
  });

  it("omits page 1 and the default sort without exposing a tie-break", () => {
    const serialized = serializeCollectionState(
      {
        keyword: "flu",
        filters: { taxon_id: ["2"] },
        page: 1,
        sort: "relevance",
      },
      options,
    );
    expect(serialized.toString()).toBe("keyword=flu&taxon_id=2");
    expect(serialized.has("page")).toBe(false);
    expect(serialized.has("sort")).toBe(false);
    expect(serialized.toString()).not.toMatch(/tie|secondary/i);
  });

  it("canonicalizes URL values while preserving unrelated repeated parameters", () => {
    const canonical = canonicalizeCollectionSearchParams(
      { page: "1", sort: "relevance", tab: "genomes", keep: ["a", "b"] },
      options,
    );
    expect(canonical.toString()).toBe("tab=genomes&keep=a&keep=b");
  });

  it("drops friendly filters from the canonical URL when rql is explicit", () => {
    const canonical = canonicalizeCollectionSearchParams(
      { rql: "eq(public,true)", taxon_id: "2", keyword: "flu" },
      options,
    );
    expect(canonical.toString()).toBe("keyword=flu&rql=eq%28public%2Ctrue%29");
  });

  it.each([
    ["keyword", { keyword: "new" }],
    ["refinement", { refine: "N034" }],
    ["structural RQL", { rql: "eq(public,true)" }],
    ["facet", { filters: { host: ["human"] } }],
    ["sort", { sort: "date" as const }],
  ])("resets page when %s changes", (_label, update) => {
    const next = updateCollectionSearchParams(
      { page: "4", tab: "genomes" },
      update,
      options,
    );
    expect(next.has("page")).toBe(false);
    expect(next.get("tab")).toBe("genomes");
  });

  it("retains page for an unrelated update or an unchanged query value", () => {
    expect(
      updateCollectionSearchParams({ page: "4" }, {}, options).get("page"),
    ).toBe("4");
    expect(
      updateCollectionSearchParams(
        { page: "4", keyword: "flu" },
        { keyword: "flu" },
        options,
      ).get("page"),
    ).toBe("4");
  });

  it("rejects invalid programmatic state", () => {
    expect(() =>
      canonicalizeCollectionState(
        { filters: {}, page: 0, sort: "relevance" },
        options,
      ),
    ).toThrow("Invalid collection page");
  });
});
