import { searchDescriptors, searchHref } from "./search-info";

describe("search descriptors", () => {
  it("routes Feature and Protein searches to canonical Feature state", () => {
    const feature = searchDescriptors.find((item) => item.id === "genome_feature");
    const protein = searchDescriptors.find((item) => item.id === "protein");
    expect(feature && searchHref(feature, "DNA kinase")).toBe("/feature?keyword=DNA%20kinase");
    expect(protein && searchHref(protein, "DNA kinase")).toBe("/feature?keyword=DNA%20kinase&filter=protein");
  });

  it("routes Epitope searches to the canonical collection", () => {
    const epitope = searchDescriptors.find((item) => item.id === "epitope");
    expect(epitope && searchHref(epitope, "linear peptide")).toBe("/epitope?keyword=linear%20peptide");
  });
});
