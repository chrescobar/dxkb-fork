import {
  featureHref,
  featureIdFromRow,
  featureListHref,
  genomeHref,
  genomeIdFromRow,
  genomeListHref,
  taxonomyHref,
} from "../hrefs";
import { rqlEq } from "../rql";

describe("taxonomyHref", () => {
  it("builds a taxonomy route from a numeric id", () => {
    expect(taxonomyHref(561)).toBe("/taxonomy/561");
  });
  it("accepts a string id", () => {
    expect(taxonomyHref("2697049")).toBe("/taxonomy/2697049");
  });
});

describe("Feature hrefs", () => {
  it("encodes member IDs and prefers the canonical row field", () => {
    expect(featureHref("fig|83332.12/peg 1")).toBe("/feature/fig%7C83332.12%2Fpeg%201");
    expect(featureIdFromRow({ feature_id: "canonical", patric_id: "alternate" })).toBe("canonical");
    expect(featureIdFromRow({ patric_id: "alternate" })).toBe("alternate");
    expect(featureIdFromRow(null)).toBeNull();
  });

  it("builds a canonical URL with encoded explicit RQL", () => {
    expect(
      featureListHref({ rql: "and(eq(genome_id,83332.12),eq(feature_type,CDS))" }),
    ).toBe(
      "/feature?rql=and(eq(genome_id%2C83332.12)%2Ceq(feature_type%2CCDS))",
    );
  });

  it("builds bare, keyword, and protein-filtered list routes", () => {
    expect(featureListHref()).toBe("/feature");
    expect(featureListHref({ keyword: "DNA kinase" })).toBe("/feature?keyword=DNA%20kinase");
    expect(featureListHref({ keyword: "kinase", filter: "protein" })).toBe("/feature?keyword=kinase&filter=protein");
  });
});

describe("genomeHref", () => {
  it("builds an encoded canonical Genome route", () => {
    expect(genomeHref("83332.12")).toBe("/genome/83332.12");
    expect(genomeHref("id/with spaces")).toBe("/genome/id%2Fwith%20spaces");
  });

  it("extracts only string or numeric Genome IDs from rows", () => {
    expect(genomeIdFromRow({ genome_id: "83332.12" })).toBe("83332.12");
    expect(genomeIdFromRow({ genome_id: 42 })).toBe("42");
    expect(genomeIdFromRow({ genome_id: { invalid: true } })).toBeNull();
    expect(genomeIdFromRow(null)).toBeNull();
  });
});

describe("genomeListHref", () => {
  it("returns the bare list route when no rql is given", () => {
    expect(genomeListHref()).toBe("/genome");
    expect(genomeListHref({})).toBe("/genome");
  });
  it("adds and URL-encodes a friendly keyword", () => {
    expect(genomeListHref({ keyword: "E. coli & phage" })).toBe(
      "/genome?keyword=E.%20coli%20%26%20phage",
    );
  });
  it("prefers explicit rql when keyword is also provided", () => {
    expect(
      genomeListHref({ keyword: "ignored", rql: "eq(genus,Escherichia)" }),
    ).toBe("/genome?rql=eq(genus%2CEscherichia)");
  });
  it("URL-encodes the rql query value once (comma → %2C, parens preserved)", () => {
    expect(genomeListHref({ rql: "eq(genus,Escherichia)" })).toBe(
      "/genome?rql=eq(genus%2CEscherichia)",
    );
  });
  it("round-trips a built rqlEq clause back to the unescaped RQL", () => {
    const href = genomeListHref({ rql: rqlEq("genus", "Escherichia") });
    const rql = new URL(href, "http://localhost").searchParams.get("rql");
    expect(rql).toBe("eq(genus,Escherichia)");
  });
});
