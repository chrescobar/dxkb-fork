import { render } from "@testing-library/react";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import { makeStrainsView } from "../strains";
import { makeSerologyView } from "../serology";
import { makeSurveillanceView } from "../surveillance";

// TaxonDataPanel has complex network + React dependencies; mock it so tests stay
// focused on the factory guard logic (null taxon → render nothing).
vi.mock("../../_components/taxon-data-panel", () => ({
  TaxonDataPanel: ({ resource, q }: { resource: string; q: string }) => (
    <div data-testid="taxon-data-panel" data-resource={resource} data-q={q} />
  ),
}));

const fakeTaxon: OrganismTaxonomy = {
  taxonId: 1234,
  taxonName: "Test Virus",
  lineageIds: [1234, 10239],
  lineageNames: ["Test Virus", "Viruses"],
  taxonRank: "species",
  genomes: null,
};

describe("makeStrainsView", () => {
  it("renders nothing when taxon is null", () => {
    const StrainsView = makeStrainsView({ taxon: null });
    const { container } = render(<StrainsView />);
    expect(container.firstChild).toBeNull();
  });

  it("renders TaxonDataPanel with strain resource and taxon query", () => {
    const StrainsView = makeStrainsView({ taxon: fakeTaxon });
    const { getByTestId } = render(<StrainsView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "strain");
    expect(panel.getAttribute("data-q")).toContain("1234");
  });
});

describe("makeSerologyView", () => {
  it("renders nothing when taxon is null", () => {
    const SerologyView = makeSerologyView({ taxon: null });
    const { container } = render(<SerologyView />);
    expect(container.firstChild).toBeNull();
  });

  it("renders TaxonDataPanel with serology resource", () => {
    const SerologyView = makeSerologyView({ taxon: fakeTaxon });
    const { getByTestId } = render(<SerologyView />);
    expect(getByTestId("taxon-data-panel")).toHaveAttribute("data-resource", "serology");
  });
});

describe("makeSurveillanceView", () => {
  it("renders nothing when taxon is null", () => {
    const SurveillanceView = makeSurveillanceView({ taxon: null });
    const { container } = render(<SurveillanceView />);
    expect(container.firstChild).toBeNull();
  });

  it("renders TaxonDataPanel with surveillance resource", () => {
    const SurveillanceView = makeSurveillanceView({ taxon: fakeTaxon });
    const { getByTestId } = render(<SurveillanceView />);
    expect(getByTestId("taxon-data-panel")).toHaveAttribute("data-resource", "surveillance");
  });
});
