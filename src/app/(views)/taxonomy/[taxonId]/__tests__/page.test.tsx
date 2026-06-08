import { render, screen } from "@testing-library/react";

import TaxonomyPage from "../page";

const fetchOrganismTaxonomyMock = vi.fn();

vi.mock("@/lib/services/organisms/taxonomy", () => ({
  fetchOrganismTaxonomy: (...args: unknown[]) => fetchOrganismTaxonomyMock(...args),
}));

const bacterialTaxon = {
  taxonId: 234,
  taxonName: "Brucella",
  lineageNames: ["Bacteria", "Pseudomonadota", "Brucella"],
  lineageIds: [2, 1224, 234],
  taxonRank: "genus",
  genomes: 1909,
};

const viralTaxon = {
  taxonId: 11320,
  taxonName: "Influenza A virus",
  lineageNames: ["Viruses", "Orthomyxoviridae", "Influenza A virus"],
  lineageIds: [10239, 11308, 11320],
  taxonRank: "species",
  genomes: 1834418,
};

beforeEach(() => {
  fetchOrganismTaxonomyMock.mockResolvedValue(bacterialTaxon);
});

const metadataSpy = vi.fn();
vi.mock("@/components/organisms/metadata-distributions/metadata-distributions", () => ({
  MetadataDistributions: (props: Record<string, unknown>) => {
    metadataSpy(props);
    return <div data-testid="metadata-distributions" />;
  },
}));

const notFoundSpy = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  notFound: () => notFoundSpy(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/taxonomy/234",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

describe("TaxonomyPage", () => {
  it("renders the heading for Brucella", async () => {
    const node = await TaxonomyPage({
      params: Promise.resolve({ taxonId: "234" }),
      searchParams: Promise.resolve({ view: "taxonomy" }),
    });

    render(node);

    expect(
      screen.getByRole("heading", { level: 1, name: "Brucella" }),
    ).toBeInTheDocument();
  });

  it("renders the taxonomy stub view when view=taxonomy", async () => {
    const node = await TaxonomyPage({
      params: Promise.resolve({ taxonId: "234" }),
      searchParams: Promise.resolve({ view: "taxonomy" }),
    });

    render(node);

    expect(
      screen.getByText(/Taxonomy browsing is stubbed/),
    ).toBeInTheDocument();
  });

  it("renders placeholder stub for amr-phenotypes view", async () => {
    const node = await TaxonomyPage({
      params: Promise.resolve({ taxonId: "234" }),
      searchParams: Promise.resolve({ view: "amr-phenotypes" }),
    });

    render(node);

    expect(screen.getAllByText("AMR Phenotypes")).toHaveLength(2);
    expect(
      screen.getByText(/This view is coming soon/),
    ).toBeInTheDocument();
  });

  it("calls notFound for non-numeric taxonId", async () => {
    notFoundSpy.mockClear();
    await expect(
      TaxonomyPage({
        params: Promise.resolve({ taxonId: "not-a-number" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundSpy).toHaveBeenCalled();
  });

  it("calls notFound for negative taxonId", async () => {
    notFoundSpy.mockClear();
    await expect(
      TaxonomyPage({
        params: Promise.resolve({ taxonId: "-5" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundSpy).toHaveBeenCalled();
  });

  it("calls notFound for taxonId of 0", async () => {
    notFoundSpy.mockClear();
    await expect(
      TaxonomyPage({
        params: Promise.resolve({ taxonId: "0" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundSpy).toHaveBeenCalled();
  });

  it("passes showAmr=true for bacterial taxa", async () => {
    metadataSpy.mockClear();
    const node = await TaxonomyPage({
      params: Promise.resolve({ taxonId: "234" }),
      searchParams: Promise.resolve({}),
    });
    render(node);

    expect(metadataSpy).toHaveBeenCalledWith(
      expect.objectContaining({ showAmr: true }),
    );
  });

  it("passes showAmr=false for viral taxa", async () => {
    fetchOrganismTaxonomyMock.mockResolvedValueOnce(viralTaxon);
    metadataSpy.mockClear();

    const node = await TaxonomyPage({
      params: Promise.resolve({ taxonId: "11320" }),
      searchParams: Promise.resolve({}),
    });
    render(node);

    expect(metadataSpy).toHaveBeenCalledWith(
      expect.objectContaining({ showAmr: false }),
    );
  });

  it("passes showAmr=false when the taxon fetch returns null", async () => {
    fetchOrganismTaxonomyMock.mockRejectedValueOnce(new Error("nope"));
    metadataSpy.mockClear();

    const node = await TaxonomyPage({
      params: Promise.resolve({ taxonId: "999" }),
      searchParams: Promise.resolve({}),
    });
    render(node);

    expect(metadataSpy).toHaveBeenCalledWith(
      expect.objectContaining({ showAmr: false }),
    );
  });
});
