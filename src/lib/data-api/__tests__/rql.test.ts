import { describe, expect, it } from "vitest";
import { eq, parseRql, serializeRql, validateRql } from "../rql";

describe("typed RQL", () => {
  it("round-trips structural predicates and field types", () => {
    expect(
      parseRql("genome", "and(eq(genome_id,83332.12),ge(genome_length,1000))"),
    ).toEqual({
      operator: "and",
      operands: [
        { operator: "eq", field: "genome_id", value: "83332.12" },
        { operator: "ge", field: "genome_length", value: 1000 },
      ],
    });
  });

  it("quotes tokenized phrase fields and safely encodes delimiters", () => {
    expect(eq("strain", "strain", "A/B, isolate (one)")).toBe(
      "eq(strain,\"A%2FB%2C%20isolate%20%28one%29\")",
    );
    expect(eq("surveillance", "pathogen_test_type", "RAT/antigen")).toBe(
      "eq(pathogen_test_type,\"RAT%2Fantigen\")",
    );
    expect(eq("serology", "test_type", "neutralizing antibody")).toBe(
      "eq(test_type,neutralizing%20antibody)",
    );
  });

  it("serializes nested expressions", () => {
    expect(
      serializeRql("epitope", {
        operator: "or",
        operands: [
          { operator: "eq", field: "epitope_type", value: "Linear peptide" },
          { operator: "keyword", value: "influenza" },
        ],
      }),
    ).toBe('or(eq(epitope_type,"Linear%20peptide"),keyword(influenza))');
  });

  it.each([
    "select(genome_id)",
    "sort(+genome_id)",
    "limit(200)",
    "facet(genus)",
  ])("rejects transport operator %s", (rql) => {
    expect(() => validateRql("genome", rql)).toThrow(/not allowed/);
  });

  it("rejects unknown fields, malformed input, and excessive nesting", () => {
    expect(() => validateRql("genome", "eq(secret,x)")).toThrow(/not allowed/);
    expect(() => validateRql("genome", "eq(genome_id,x")).toThrow(/Malformed/);
    const nested = `${"not(".repeat(14)}eq(genome_id,x)${")".repeat(14)}`;
    expect(() => validateRql("genome", nested)).toThrow(/too deep/);
  });
});
