import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("@/lib/services/organisms/summary", () => ({
  fetchOrganismSummary: vi.fn(),
}));

import { TaxonomySummary } from "../taxonomy-summary";
import { fetchOrganismSummary } from "@/lib/services/organisms/summary";

const brucellaTaxon = {
  taxonId: 234,
  taxonName: "Brucella",
  taxonRank: "genus",
  lineageNames: [],
  lineageIds: [],
  genomes: 1909,
};

async function renderServer(node: Promise<React.ReactElement>) {
  return render(await node);
}

describe("TaxonomySummary", () => {
  it("renders all metrics when summary fetch succeeds and taxon prop is provided", async () => {
    vi.mocked(fetchOrganismSummary).mockResolvedValueOnce({
      count: 1909,
      uniqueFamily: 1,
      uniqueGenus: 1,
      uniqueSpecies: 5,
      cds: 1_000_000,
      matPeptide: null,
      pdb: 50,
    });

    await renderServer(TaxonomySummary({ taxonId: 234, taxon: brucellaTaxon }));

    expect(screen.getByText("Brucella")).toBeInTheDocument();
    expect(screen.getByText("Genus")).toBeInTheDocument();
    expect(screen.getByText("1,909")).toBeInTheDocument();
    expect(screen.getByText("1,000,000")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("renders taxon fields and '-' for summary metrics when summary fetch fails", async () => {
    vi.mocked(fetchOrganismSummary).mockRejectedValueOnce(new Error("summary down"));

    await renderServer(TaxonomySummary({ taxonId: 234, taxon: brucellaTaxon }));

    expect(screen.getByText("Brucella")).toBeInTheDocument();
    // Each summary metric falls back to "-" — there are 4 (species, count, cds, pdb)
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(4);
  });

  it("renders summary metrics and '-' for taxon fields when taxon prop is null", async () => {
    vi.mocked(fetchOrganismSummary).mockResolvedValueOnce({
      count: 1909,
      uniqueFamily: null,
      uniqueGenus: null,
      uniqueSpecies: 5,
      cds: null,
      matPeptide: null,
      pdb: null,
    });

    await renderServer(TaxonomySummary({ taxonId: 234, taxon: null }));

    // Taxon ID falls back to the input taxonId
    expect(screen.getByText("234")).toBeInTheDocument();
    expect(screen.getByText("1,909")).toBeInTheDocument();
    // Two taxon-derived strings (taxonName, taxonRank) are "-"
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
  });

  it("throws when summary fetch fails and taxon prop is null", async () => {
    vi.mocked(fetchOrganismSummary).mockRejectedValueOnce(new Error("summary boom"));

    await expect(TaxonomySummary({ taxonId: 234, taxon: null })).rejects.toThrow("summary boom");
  });
});
