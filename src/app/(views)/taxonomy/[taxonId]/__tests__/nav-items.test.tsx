// src/app/(views)/taxonomy/[taxonId]/__tests__/nav-items.test.tsx
import { buildTaxonomyNavItems } from "../_components/nav-items";
import { buildTaxonomyConfig } from "../_config";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

function tax(over: Partial<OrganismTaxonomy>): OrganismTaxonomy {
  return { taxonId: 1, taxonName: "x", taxonRank: "species", lineageNames: [], lineageIds: [], genomes: 0, ...over };
}

describe("buildTaxonomyNavItems", () => {
  it("returns all 15 tabs", () => {
    const taxon = tax({ lineageNames: ["Bacteria"] });
    const items = buildTaxonomyNavItems(buildTaxonomyConfig(1, taxon), taxon, null);
    expect(items).toHaveLength(15);
  });

  it("enables interactions for a bacterial taxon", () => {
    const taxon = tax({ taxonId: 562, lineageNames: ["Bacteria", "Pseudomonadota"], lineageIds: [2, 562] });
    const items = buildTaxonomyNavItems(buildTaxonomyConfig(562, taxon), taxon, null);
    const byKey = Object.fromEntries(items.map((i) => [i.key, i.enabled !== false]));
    expect(byKey["interactions"]).toBe(true);
    expect(byKey["strains"]).toBe(false);
  });

  it("disables interactions (shown, not removed) for a viral taxon", () => {
    const taxon = tax({ taxonId: 11320, lineageNames: ["Viruses", "Orthomyxoviridae"], lineageIds: [10239, 11320] });
    const items = buildTaxonomyNavItems(buildTaxonomyConfig(11320, taxon), taxon, null);
    const interactions = items.find((i) => i.key === "interactions");
    expect(interactions).toBeDefined();
    expect(interactions?.enabled).toBe(false);
    expect(interactions?.disabledReason).toMatch(/bacterial/i);
  });

  it("injects the real overview component (not a placeholder)", () => {
    const taxon = tax({ lineageNames: ["Bacteria"] });
    const items = buildTaxonomyNavItems(buildTaxonomyConfig(1, taxon), taxon, null);
    const overview = items.find((i) => i.key === "overview");
    expect(overview?.Component.name).not.toMatch(/PlaceholderView/);
    expect(overview?.Component.name).toBe("OverviewView");
  });

  it("injects the real data views (not placeholders)", () => {
    // resolveComponent returns the override Component regardless of gate state,
    // so any taxon surfaces the real named fn. Catches a dropped override
    // silently falling back to makePlaceholderView.
    const taxon = tax({ lineageNames: ["Bacteria"] });
    const items = buildTaxonomyNavItems(buildTaxonomyConfig(1, taxon), taxon, null);
    const name = (k: string) => items.find((i) => i.key === k)?.Component.name;
    expect(name("genomes")).toBe("GenomesView");
    expect(name("features")).toBe("FeaturesView");
    expect(name("strains")).toBe("StrainsView");
    expect(name("surveillance")).toBe("SurveillanceView");
    expect(name("serology")).toBe("SerologyView");
    expect(name("sfvt")).toBe("SfvtView");
    expect(name("epitopes")).toBe("EpitopesView");
    expect(items.find((i) => i.key === "features")?.layout).toBe("fill");
    expect(items.find((i) => i.key === "epitopes")?.layout).toBe("fill");
  });
});
