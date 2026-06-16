import { escapeRqlValue, friendlyParamsToRql, resolveListQuery, rqlEq, rqlKeyword } from "../rql";

describe("escapeRqlValue", () => {
  it("passes plain alphanumeric values through unchanged", () => {
    expect(escapeRqlValue("Escherichia")).toBe("Escherichia");
  });
  it("percent-encodes RQL-special characters", () => {
    expect(escapeRqlValue("a,b")).toBe("a%2Cb");
    expect(escapeRqlValue("flu)")).toBe("flu%29");
    expect(escapeRqlValue("(x")).toBe("%28x");
  });
});

describe("rqlEq / rqlKeyword", () => {
  it("builds an eq clause with an escaped value", () => {
    expect(rqlEq("genus", "Escherichia")).toBe("eq(genus,Escherichia)");
    expect(rqlEq("name", "a,b")).toBe("eq(name,a%2Cb)");
  });
  it("builds a keyword clause with an escaped value", () => {
    expect(rqlKeyword("flu)")).toBe("keyword(flu%29)");
  });
});

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
