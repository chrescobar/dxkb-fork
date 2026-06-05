import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("@/lib/services/organisms/summary", () => ({
  fetchOrganismSummary: vi.fn(),
}));

vi.mock("@/lib/services/organisms/taxonomy", () => ({
  fetchOrganismTaxonomy: vi.fn(),
}));

import { TaxonomySummary } from "../taxonomy-summary";
import { fetchOrganismSummary } from "@/lib/services/organisms/summary";
import { fetchOrganismTaxonomy } from "@/lib/services/organisms/taxonomy";

async function renderServer(node: Promise<React.ReactElement>) {
  return render(await node);
}

describe("TaxonomySummary", () => {
  it("renders all metrics when both fetches succeed", async () => {
    vi.mocked(fetchOrganismSummary).mockResolvedValueOnce({
      count: 1909,
      uniqueFamily: 1,
      uniqueGenus: 1,
      uniqueSpecies: 5,
      cds: 1_000_000,
      matPeptide: null,
      pdb: 50,
    });
    vi.mocked(fetchOrganismTaxonomy).mockResolvedValueOnce({
      taxonId: 234,
      taxonName: "Brucella",
      taxonRank: "genus",
      lineageNames: [],
      lineageIds: [],
      genomes: 1909,
    });

    await renderServer(TaxonomySummary({ taxonId: 234 }));

    expect(screen.getByText("Brucella")).toBeInTheDocument();
    expect(screen.getByText("genus")).toBeInTheDocument();
    expect(screen.getByText("1,909")).toBeInTheDocument();
    expect(screen.getByText("1,000,000")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("renders taxon fields and '-' for summary metrics when summary fetch fails", async () => {
    vi.mocked(fetchOrganismSummary).mockRejectedValueOnce(new Error("summary down"));
    vi.mocked(fetchOrganismTaxonomy).mockResolvedValueOnce({
      taxonId: 234,
      taxonName: "Brucella",
      taxonRank: "genus",
      lineageNames: [],
      lineageIds: [],
      genomes: 1909,
    });

    await renderServer(TaxonomySummary({ taxonId: 234 }));

    expect(screen.getByText("Brucella")).toBeInTheDocument();
    // Each summary metric falls back to "-" — there are 4 (species, count, cds, pdb)
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(4);
  });

  it("renders summary metrics and '-' for taxon fields when taxonomy fetch fails", async () => {
    vi.mocked(fetchOrganismSummary).mockResolvedValueOnce({
      count: 1909,
      uniqueFamily: null,
      uniqueGenus: null,
      uniqueSpecies: 5,
      cds: null,
      matPeptide: null,
      pdb: null,
    });
    vi.mocked(fetchOrganismTaxonomy).mockRejectedValueOnce(new Error("taxonomy down"));

    await renderServer(TaxonomySummary({ taxonId: 234 }));

    // Taxon ID falls back to the input taxonId
    expect(screen.getByText("234")).toBeInTheDocument();
    expect(screen.getByText("1,909")).toBeInTheDocument();
    // Two taxon-derived strings (taxonName, taxonRank) are "-"
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
  });

  it("throws when both fetches fail (surfaces the original summary error)", async () => {
    vi.mocked(fetchOrganismSummary).mockRejectedValueOnce(new Error("summary boom"));
    vi.mocked(fetchOrganismTaxonomy).mockRejectedValueOnce(new Error("tax boom"));

    await expect(TaxonomySummary({ taxonId: 234 })).rejects.toThrow("summary boom");
  });
});
