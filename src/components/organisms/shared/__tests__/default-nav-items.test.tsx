import { render, screen } from "@testing-library/react";

import { buildOrganismNavItems } from "../default-nav-items";

function CustomOverview() {
  return <div>custom overview component</div>;
}

describe("buildOrganismNavItems", () => {
  it("returns 11 default nav items in fixed order", () => {
    const items = buildOrganismNavItems();
    expect(items).toHaveLength(11);
    expect(items.map((i) => i.key)).toEqual([
      "overview",
      "phylogeny",
      "taxonomy",
      "genomes",
      "sequences",
      "features",
      "protein-structures",
      "domains-and-motifs",
      "epitopes",
      "experiments",
      "interactions",
    ]);
  });

  it("each item carries a key, label, icon, and Component", () => {
    const items = buildOrganismNavItems();
    for (const item of items) {
      expect(item.key).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.icon).toBeTruthy();
      expect(item.Component).toBeTruthy();
    }
  });

  it("default placeholders render the per-key description copy when provided", () => {
    const items = buildOrganismNavItems();
    const phylogeny = items.find((i) => i.key === "phylogeny");
    expect(phylogeny).toBeDefined();
    if (!phylogeny) return;
    const Comp = phylogeny.Component;
    render(<Comp />);
    expect(screen.getByText(/Phylogeny data and visualization/)).toBeInTheDocument();
  });

  it("override with Component swaps in the custom component", () => {
    const items = buildOrganismNavItems({
      overview: { Component: CustomOverview },
    });
    const overview = items.find((i) => i.key === "overview");
    expect(overview).toBeDefined();
    expect(overview?.Component).toBe(CustomOverview);
  });

  it("override with description rewrites the placeholder text without changing the Component slot", () => {
    const items = buildOrganismNavItems({
      phylogeny: { description: "custom phylogeny copy" },
    });
    const phylogeny = items.find((i) => i.key === "phylogeny");
    expect(phylogeny).toBeDefined();
    if (!phylogeny) return;
    const Comp = phylogeny.Component;
    render(<Comp />);
    expect(screen.getByText("custom phylogeny copy")).toBeInTheDocument();
  });

  it("override with description: undefined clears the default description", () => {
    const items = buildOrganismNavItems({
      phylogeny: { description: undefined },
    });
    const phylogeny = items.find((i) => i.key === "phylogeny");
    expect(phylogeny).toBeDefined();
    if (!phylogeny) return;
    const Comp = phylogeny.Component;
    render(<Comp />);
    expect(screen.queryByText(/Phylogeny data and visualization/)).not.toBeInTheDocument();
  });

  it("non-overridden keys preserve their defaults when other keys are overridden", () => {
    const items = buildOrganismNavItems({ overview: { Component: CustomOverview } });
    const phylogeny = items.find((i) => i.key === "phylogeny");
    expect(phylogeny).toBeDefined();
    if (!phylogeny) return;
    const Comp = phylogeny.Component;
    render(<Comp />);
    expect(screen.getByText(/Phylogeny data and visualization/)).toBeInTheDocument();
  });

  it("exclude removes the listed keys from the returned list", () => {
    const items = buildOrganismNavItems({}, { exclude: ["sequences"] });
    expect(items).toHaveLength(10);
    expect(items.find((i) => i.key === "sequences")).toBeUndefined();
  });

  it("exclude accepts multiple keys", () => {
    const items = buildOrganismNavItems({}, { exclude: ["sequences", "epitopes"] });
    expect(items).toHaveLength(9);
    expect(items.find((i) => i.key === "sequences")).toBeUndefined();
    expect(items.find((i) => i.key === "epitopes")).toBeUndefined();
  });

  it("omitting the options object preserves all default items", () => {
    const items = buildOrganismNavItems({ overview: { Component: CustomOverview } });
    expect(items).toHaveLength(11);
  });
});
