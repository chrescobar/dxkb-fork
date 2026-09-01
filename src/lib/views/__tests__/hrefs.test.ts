import {
  epitopeHref,
  epitopeIdFromRow,
  epitopeListHref,
  featureHref,
  featureIdFromRow,
  featureListHref,
  genomeHref,
  genomeIdFromRow,
  genomeListHref,
  serologyHref,
  serologyIdFromRow,
  serologyListHref,
  surveillanceHref,
  surveillanceIdFromRow,
  surveillanceListHref,
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

describe("Epitope hrefs", () => {
  it("builds encoded member and collection routes", () => {
    expect(epitopeHref("15/780")).toBe("/epitope/15%2F780");
    expect(epitopeIdFromRow({ epitope_id: 15780 })).toBe("15780");
    expect(epitopeIdFromRow(null)).toBeNull();
    expect(epitopeListHref()).toBe("/epitope");
    expect(epitopeListHref({ keyword: "linear peptide", taxonId: 11520 })).toBe("/epitope?keyword=linear%20peptide&taxon_id=11520");
    expect(epitopeListHref({ keyword: "ignored", rql: "eq(epitope_type,B-cell)" })).toBe("/epitope?rql=eq(epitope_type%2CB-cell)");
  });
});

describe("Surveillance hrefs", () => {
  it("uses the public sample identifier and encodes the optional discriminator", () => {
    expect(
      surveillanceIdFromRow({ id: "backend-1", sample_identifier: "sample/1" }),
    ).toBe("sample/1");
    expect(surveillanceIdFromRow({ id: "backend-only" })).toBeNull();
    expect(surveillanceHref("sample/1", "RAT/antigen")).toBe(
      "/surveillance/sample%2F1?pathogen_test_type=RAT%2Fantigen",
    );
  });

  it("builds collection links with repeated friendly facets and RQL precedence", () => {
    expect(surveillanceListHref()).toBe("/surveillance");
    expect(
      surveillanceListHref({
        keyword: "avian flu",
        pathogenTestType: ["PCR", "RAT/antigen"],
      }),
    ).toBe(
      "/surveillance?keyword=avian%20flu&pathogen_test_type=PCR&pathogen_test_type=RAT%2Fantigen",
    );
    expect(
      surveillanceListHref({
        keyword: "ignored",
        rql: "eq(collection_country,US)",
      }),
    ).toBe("/surveillance?rql=eq(collection_country%2CUS)");
  });
});

describe("Serology hrefs", () => {
  it("preserves digit-only IDs and encodes scalar test types", () => {
    expect(
      serologyIdFromRow({ id: "backend-1", sample_identifier: "000123" }),
    ).toBe("000123");
    expect(serologyIdFromRow({ id: "backend-only" })).toBeNull();
    expect(serologyHref("sample/1", "ELISA/IgG test")).toBe(
      "/serology/sample%2F1?test_type=ELISA%2FIgG%20test",
    );
  });

  it("builds collection links with repeated facets and RQL precedence", () => {
    expect(
      serologyListHref({
        keyword: "antibody",
        testType: ["ELISA", "Western blot"],
      }),
    ).toBe(
      "/serology?keyword=antibody&test_type=ELISA&test_type=Western%20blot",
    );
    expect(
      serologyListHref({
        keyword: "ignored",
        rql: "eq(collection_country,US)",
      }),
    ).toBe("/serology?rql=eq(collection_country%2CUS)");
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
