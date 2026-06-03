import { render, screen } from "@testing-library/react";

import TaxonomyPage from "../page";

vi.mock("@/lib/services/organisms/taxonomy", () => ({
  fetchOrganismTaxonomy: vi.fn().mockResolvedValue({
    taxonId: 234,
    taxonName: "Brucella",
    lineageNames: ["Bacteria", "Pseudomonadota", "Brucella"],
    lineageIds: [2, 1224, 234],
    taxonRank: "genus",
    genomes: 1909,
  }),
}));

describe("TaxonomyPage", () => {
  it("renders the heading for Brucella", async () => {
    const node = await TaxonomyPage({
      searchParams: Promise.resolve({ view: "taxonomy" }),
    });

    render(node);

    expect(
      screen.getByRole("heading", { level: 1, name: "Brucella" }),
    ).toBeInTheDocument();
  });

  it("renders the taxonomy stub view when view=taxonomy", async () => {
    const node = await TaxonomyPage({
      searchParams: Promise.resolve({ view: "taxonomy" }),
    });

    render(node);

    expect(
      screen.getByText(/Taxonomy browsing is stubbed/),
    ).toBeInTheDocument();
  });

  it("renders placeholder stub for amr-phenotypes view", async () => {
    const node = await TaxonomyPage({
      searchParams: Promise.resolve({ view: "amr-phenotypes" }),
    });

    render(node);

    expect(screen.getAllByText("AMR Phenotypes")).toHaveLength(2);
    expect(
      screen.getByText(/This view is coming soon/),
    ).toBeInTheDocument();
  });
});
