import { render, screen } from "@testing-library/react";

import VirusesPage from "../page";

const { fetchTaxonomy } = vi.hoisted(() => ({ fetchTaxonomy: vi.fn() }));

vi.mock("@/lib/services/organisms/taxonomy", () => ({
  fetchOrganismTaxonomy: (taxonId: number) => fetchTaxonomy(taxonId) as unknown,
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/organisms/viruses",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/organisms/taxon-views", () => ({
  buildTaxonViews: ({ OverviewComponent }: { OverviewComponent: React.ComponentType }) => [
    { key: "overview", label: "Overview", icon: null, Component: OverviewComponent },
    { key: "features", label: "Features", icon: null, Component: () => <div>Real features</div>, layout: "fill" },
    { key: "taxa-tree", label: "Taxa Tree", icon: null, Component: () => <div>Real tree</div>, layout: "fill" },
  ],
}));

beforeEach(() => {
  fetchTaxonomy.mockResolvedValue({ taxonId: 10239, taxonName: "Viruses" });
});

describe("VirusesPage", () => {
  it("fetches the viral root", async () => {
    render(await VirusesPage({ searchParams: Promise.resolve({ tab: "features" }) }));
    expect(fetchTaxonomy).toHaveBeenCalledWith(10239);
    expect(screen.getByText("Real features")).toBeInTheDocument();
  });

  it("supports legacy ?view= when ?tab= is absent", async () => {
    render(await VirusesPage({ searchParams: Promise.resolve({ view: "features" }) }));
    expect(screen.getByText("Real features")).toBeInTheDocument();
  });

  it("prefers ?tab= over ?view=", async () => {
    render(
      await VirusesPage({
        searchParams: Promise.resolve({ tab: "taxa-tree", view: "features" }),
      }),
    );
    expect(screen.getByText("Real tree")).toBeInTheDocument();
    expect(screen.queryByText("Real features")).not.toBeInTheDocument();
  });
});
