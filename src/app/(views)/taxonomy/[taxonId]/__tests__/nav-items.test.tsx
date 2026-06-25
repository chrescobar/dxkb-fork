// src/app/(views)/taxonomy/[taxonId]/__tests__/nav-items.test.tsx
import { buildTaxonomyNavItems } from "../_components/nav-items";
import { buildTaxonomyConfig } from "../_config";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

function tax(over: Partial<OrganismTaxonomy>): OrganismTaxonomy {
  return { taxonId: 1, taxonName: "x", taxonRank: "species", lineageNames: [], lineageIds: [], genomes: 0, ...over };
}

describe("buildTaxonomyNavItems", () => {
  it("returns all 20 tabs", () => {
    const taxon = tax({ lineageNames: ["Bacteria"] });
    const items = buildTaxonomyNavItems(buildTaxonomyConfig(1, taxon), taxon, null);
    expect(items).toHaveLength(20);
  });

  it("enables the bacteria cluster for a bacterial taxon", () => {
    const taxon = tax({ taxonId: 562, lineageNames: ["Bacteria", "Pseudomonadota"], lineageIds: [2, 562] });
    const items = buildTaxonomyNavItems(buildTaxonomyConfig(562, taxon), taxon, null);
    const byKey = Object.fromEntries(items.map((i) => [i.key, i.enabled !== false]));
    expect(byKey["amr-phenotypes"]).toBe(true);
    expect(byKey["pathways"]).toBe(true);
    expect(byKey["strains"]).toBe(false);
  });

  it("disables the bacteria cluster (shown, not removed) for a viral taxon", () => {
    const taxon = tax({ taxonId: 11320, lineageNames: ["Viruses", "Orthomyxoviridae"], lineageIds: [10239, 11320] });
    const items = buildTaxonomyNavItems(buildTaxonomyConfig(11320, taxon), taxon, null);
    const amr = items.find((i) => i.key === "amr-phenotypes");
    expect(amr).toBeDefined();
    expect(amr?.enabled).toBe(false);
    expect(amr?.disabledReason).toMatch(/bacterial/i);
  });

  it("injects the real overview component (not a placeholder)", () => {
    const taxon = tax({ lineageNames: ["Bacteria"] });
    const items = buildTaxonomyNavItems(buildTaxonomyConfig(1, taxon), taxon, null);
    const overview = items.find((i) => i.key === "overview");
    expect(overview?.Component.name).not.toMatch(/PlaceholderView/);
    expect(overview?.Component.name).toBe("OverviewView");
  });
});
