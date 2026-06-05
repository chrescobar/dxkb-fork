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
});
