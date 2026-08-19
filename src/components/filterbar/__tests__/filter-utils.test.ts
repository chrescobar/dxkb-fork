import { buildRql } from "../filter-utils";

// Regression: Solr string fields (epitope_type, assay_results, etc.) split an
// unquoted multi-word eq() value into separate ANDed terms —
// `eq(epitope_type,Linear peptide)` becomes `epitope_type:Linear AND
// epitope_type:peptide`, which matches nothing. Every facet click across every
// resource (genome, strain, epitope, surveillance, ...) goes through this one
// buildRql(), so quoting eq() values here fixes the bug for all views at once.
describe("buildRql", () => {
  it("quotes a multi-word eq() value so Solr treats it as one phrase", () => {
    const rql = buildRql({
      selected: [{ field: "epitope_type", value: "Linear peptide", op: "eq" }],
      keywords: [],
    });
    expect(rql).toBe("eq(epitope_type,%22Linear%20peptide%22)");
  });

  it("quotes a single-word eq() value the same way (matches legacy convention)", () => {
    const rql = buildRql({
      selected: [{ field: "genome_status", value: "Complete", op: "eq" }],
      keywords: [],
    });
    expect(rql).toBe("eq(genome_status,%22Complete%22)");
  });

  it("quotes each branch of an or() group for the same field", () => {
    const rql = buildRql({
      selected: [
        { field: "epitope_type", value: "Linear peptide", op: "eq" },
        { field: "epitope_type", value: "Discontinuous peptide", op: "eq" },
      ],
      keywords: [],
    });
    expect(rql).toBe(
      "or(eq(epitope_type,%22Linear%20peptide%22),eq(epitope_type,%22Discontinuous%20peptide%22))",
    );
  });

  it("quotes eq() values across different fields joined with and()", () => {
    const rql = buildRql({
      selected: [
        { field: "epitope_type", value: "Linear peptide", op: "eq" },
        { field: "host_name", value: "Homo sapiens, human", op: "eq" },
      ],
      keywords: [],
    });
    expect(rql).toBe(
      "and(eq(epitope_type,%22Linear%20peptide%22),eq(host_name,%22Homo%20sapiens%2C%20human%22))",
    );
  });

  it("does not quote between() values (numeric ranges, not string phrase matches)", () => {
    const rql = buildRql({
      selected: [{ field: "genome_length", value: ["100", "200"], op: "between" }],
      keywords: [],
    });
    expect(rql).toBe("between(genome_length,100,200)");
  });

  it("escapes parentheses inside a quoted eq() value", () => {
    const rql = buildRql({
      selected: [{ field: "host_name", value: "Mus musculus B10.A(4R", op: "eq" }],
      keywords: [],
    });
    expect(rql).toBe("eq(host_name,%22Mus%20musculus%20B10.A%284R%22)");
  });

  it("does not quote gt() values (numeric comparison, not a phrase match)", () => {
    const rql = buildRql({
      selected: [{ field: "genome_length", value: "100", op: "gt" }],
      keywords: [],
    });
    expect(rql).toBe("gt(genome_length,100)");
  });

  it("returns empty string when nothing is selected", () => {
    expect(buildRql({ selected: [], keywords: [] })).toBe("");
  });
});
