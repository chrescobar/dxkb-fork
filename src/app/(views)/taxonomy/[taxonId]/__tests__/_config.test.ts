import { buildTaxonomyConfig } from "../_config";

describe("buildTaxonomyConfig", () => {
  it("returns a Bacteria accent when the lineage has no Viruses/Fungi marker", () => {
    const config = buildTaxonomyConfig(234, {
      taxonId: 234,
      taxonName: "Brucella",
      taxonRank: "genus",
      lineageNames: ["Bacteria", "Brucella"],
      lineageIds: [2, 234],
      genomes: 1909,
    });
    expect(config).toEqual({
      displayName: "Brucella",
      taxonId: 234,
      accent: "bacteria",
      defaultView: "overview",
      metadataFields: [
        "host_group",
        "isolation_country",
        "collection_year",
        "host_common_name",
        "isolation_source",
        "serovar",
      ],
    });
  });

  it("returns a Viruses accent when 'Viruses' appears in the lineage", () => {
    const config = buildTaxonomyConfig(10239, {
      taxonId: 10239,
      taxonName: "Viruses",
      taxonRank: "superkingdom",
      lineageNames: ["Viruses"],
      lineageIds: [10239],
      genomes: 0,
    });
    expect(config.accent).toBe("viruses");
  });

  it("returns a Fungi accent when 'Fungi' appears in the lineage", () => {
    const config = buildTaxonomyConfig(4751, {
      taxonId: 4751,
      taxonName: "Fungi",
      taxonRank: "kingdom",
      lineageNames: ["Eukaryota", "Fungi"],
      lineageIds: [2759, 4751],
      genomes: 0,
    });
    expect(config.accent).toBe("fungi");
  });

  it("falls back to a placeholder displayName when taxon is null", () => {
    const config = buildTaxonomyConfig(999, null);
    expect(config.displayName).toBe("Taxon 999");
    // null taxon → empty lineage → no Viruses/Fungi/Bacteria match → "all"
    expect(config.accent).toBe("all");
  });

  it("returns 'all' accent for organisms outside Bacteria/Viruses/Fungi lineages", () => {
    const config = buildTaxonomyConfig(2157, {
      taxonId: 2157,
      taxonName: "Archaea",
      taxonRank: "superkingdom",
      lineageNames: ["Archaea"],
      lineageIds: [2157],
      genomes: 1000,
    });
    expect(config.accent).toBe("all");
  });
});
