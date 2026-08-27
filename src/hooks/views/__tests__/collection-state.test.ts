import {
  parseCollectionState,
  resourceCollectionPageSize,
  serializeCollectionState,
  updateCollectionSearchParams,
} from "../collection-state";

const options = {
  defaultSort: "name:asc",
  sortAllowlist: ["name:asc", "year:desc"] as const,
  friendlyFilters: ["taxon_id", "host"] as const,
};

describe("view collection state exports", () => {
  it("pins the shared page size at 200", () => {
    expect(resourceCollectionPageSize).toBe(200);
  });

  it("keeps explicit rql independent from keyword and ahead of friendly filters", () => {
    expect(
      parseCollectionState(
        {
          keyword: "flu",
          rql: "eq(host,human)",
          taxon_id: "123",
          page: "3",
          sort: "year:desc",
        },
        options,
      ),
    ).toEqual({
      keyword: "flu",
      rql: "eq(host,human)",
      page: 3,
      sort: "year:desc",
      filters: {},
    });
  });

  it("omits canonical defaults and resets paging when filters change", () => {
    const state = parseCollectionState({ host: "human" }, options);
    expect(serializeCollectionState(state, options).toString()).toBe(
      "host=human",
    );
    expect(
      updateCollectionSearchParams(
        { page: "8", host: "human", tab: "details" },
        { filters: { host: ["swine"] } },
        options,
      ).toString(),
    ).toBe("tab=details&host=swine");
  });
});
