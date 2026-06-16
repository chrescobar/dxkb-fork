import { mapLegacyViewPath } from "../legacy-redirect";

describe("mapLegacyViewPath", () => {
  it("maps a singular legacy path", () => {
    expect(mapLegacyViewPath("/view/Genome/59201.7581", "")).toEqual({
      pathname: "/genome/59201.7581",
      search: "",
    });
  });
  it("maps a list legacy path with raw RQL into ?rql=", () => {
    expect(mapLegacyViewPath("/view/GenomeList/", "eq(taxon_id,1763)")).toEqual({
      pathname: "/genome",
      search: "rql=eq(taxon_id%2C1763)",
    });
  });
  it("maps TaxonList to the taxonomy segment", () => {
    expect(mapLegacyViewPath("/view/TaxonList/", "eq(taxon_lineage_ids,1763)")).toEqual({
      pathname: "/taxonomy",
      search: "rql=eq(taxon_lineage_ids%2C1763)",
    });
  });
  it("preserves a named query param (surveillance)", () => {
    expect(
      mapLegacyViewPath("/view/Surveillance/ISDN123456", "pathogen_test_type=Influenza%20A"),
    ).toEqual({
      pathname: "/surveillance/ISDN123456",
      search: "pathogen_test_type=Influenza+A",
    });
  });
  it("returns null for an unknown legacy view name", () => {
    expect(mapLegacyViewPath("/view/Nonsense/1", "")).toBeNull();
  });
  it("returns null for a non-/view path", () => {
    expect(mapLegacyViewPath("/genome/123", "")).toBeNull();
  });
});
