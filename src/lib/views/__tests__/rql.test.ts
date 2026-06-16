import { friendlyParamsToRql, resolveListQuery } from "../rql";

describe("friendlyParamsToRql", () => {
  it("maps keyword to keyword()", () => {
    expect(friendlyParamsToRql({ keyword: "influenza" }, ["keyword"])).toBe("keyword(influenza)");
  });
  it("maps a scalar field to eq()", () => {
    expect(friendlyParamsToRql({ taxon_id: "1763" }, ["taxon_id"])).toBe("eq(taxon_id,1763)");
  });
  it("composes multiple params with and()", () => {
    const out = friendlyParamsToRql({ keyword: "flu", taxon_id: "1763" }, ["keyword", "taxon_id"]);
    expect(out).toBe("and(keyword(flu),eq(taxon_id,1763))");
  });
  it("ignores params not in the allow-list", () => {
    expect(friendlyParamsToRql({ evil: "x", keyword: "flu" }, ["keyword"])).toBe("keyword(flu)");
  });
  it("returns empty string when nothing matches", () => {
    expect(friendlyParamsToRql({}, ["keyword"])).toBe("");
  });
});

describe("resolveListQuery", () => {
  it("prefers explicit rql over friendly params", () => {
    const out = resolveListQuery({ rql: "eq(public,false)", keyword: "flu" }, ["keyword"]);
    expect(out).toBe("eq(public,false)");
  });
  it("falls back to friendly params when no rql", () => {
    expect(resolveListQuery({ keyword: "flu" }, ["keyword"])).toBe("keyword(flu)");
  });
  it("takes the first value when a param repeats", () => {
    expect(resolveListQuery({ keyword: ["a", "b"] }, ["keyword"])).toBe("keyword(a)");
  });
  it("returns empty string for empty input", () => {
    expect(resolveListQuery({}, ["keyword"])).toBe("");
  });
});
