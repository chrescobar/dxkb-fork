import { featuredViruses } from "../featured-viruses-data";

describe("featuredViruses", () => {
  it("all entries have a non-empty name and href", () => {
    for (const v of featuredViruses) {
      expect(v.name.length).toBeGreaterThan(0);
      expect(v.href.length).toBeGreaterThan(0);
    }
  });

  it("viewLabel is a non-empty string when present", () => {
    for (const v of featuredViruses) {
      if (v.viewLabel !== undefined) {
        expect(typeof v.viewLabel).toBe("string");
        expect(v.viewLabel.length).toBeGreaterThan(0);
      }
    }
  });

  it("names are unique", () => {
    const names = featuredViruses.map((v) => v.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("includes known curated viruses", () => {
    const names = featuredViruses.map((v) => v.name);
    for (const expected of ["SARS-CoV-2", "Influenza A virus", "Dengue virus", "Monkeypox Virus"]) {
      expect(names, `missing "${expected}"`).toContain(expected);
    }
  });

  it("taxonomy-based hrefs embed the correct taxon ID", () => {
    const cases: [string, string][] = [
      ["SARS-CoV-2", "2697049"],
      ["Influenza A virus", "2955291"],
      ["Dengue virus", "3052464"],
    ];
    for (const [name, taxonId] of cases) {
      const entry = featuredViruses.find((v) => v.name === name);
      expect(entry, `${name} missing from featuredViruses`).toBeDefined();
      expect(entry?.href, `${name} href should contain taxon ID ${taxonId}`).toContain(taxonId);
    }
  });

  it("bespoke RQL hrefs (Bacteriophages, Ebolavirus) target the genome view", () => {
    const bespoke = featuredViruses.filter((v) => v.viewLabel === "genomes");
    const names = bespoke.map((v) => v.name);
    expect(names).toContain("Bacteriophages");
    expect(names).toContain("Ebolavirus");
  });
});
