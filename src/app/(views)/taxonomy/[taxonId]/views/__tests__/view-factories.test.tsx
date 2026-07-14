import { render } from "@testing-library/react";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import { makeStrainsView } from "../strains";
import { makeSerologyView } from "../serology";
import { makeSurveillanceView } from "../surveillance";
import { makeGenomesView } from "../genomes";
import { makeSequencesView } from "../sequences";

// TaxonDataPanel has complex network + React dependencies; mock it so tests stay
// focused on the factory guard logic (null taxon → render nothing).
vi.mock("../../_components/taxon-data-panel", () => ({
  TaxonDataPanel: ({ resource, q, guideUrl }: { resource: string; q: string; guideUrl?: string }) => (
    <div data-testid="taxon-data-panel" data-resource={resource} data-q={q} data-guide={guideUrl} />
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

  it("renders TaxonDataPanel with serology resource and taxon query", () => {
    const SerologyView = makeSerologyView({ taxon: fakeTaxon });
    const { getByTestId } = render(<SerologyView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "serology");
    expect(panel.getAttribute("data-q")).toContain("1234");
  });
});

describe("makeSurveillanceView", () => {
  it("renders nothing when taxon is null", () => {
    const SurveillanceView = makeSurveillanceView({ taxon: null });
    const { container } = render(<SurveillanceView />);
    expect(container.firstChild).toBeNull();
  });

  it("renders TaxonDataPanel with surveillance resource and taxon query", () => {
    const SurveillanceView = makeSurveillanceView({ taxon: fakeTaxon });
    const { getByTestId } = render(<SurveillanceView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "surveillance");
    expect(panel.getAttribute("data-q")).toContain("1234");
  });
});

describe("makeGenomesView", () => {
  it("renders nothing when taxon is null", () => {
    const GenomesView = makeGenomesView({ taxon: null });
    const { container } = render(<GenomesView />);
    expect(container.firstChild).toBeNull();
  });

  it("renders TaxonDataPanel with genome resource and taxon query", () => {
    const GenomesView = makeGenomesView({ taxon: fakeTaxon });
    const { getByTestId } = render(<GenomesView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "genome");
    expect(panel.getAttribute("data-q")).toContain("1234");
  });
});

describe("makeSequencesView", () => {
  it("renders nothing when taxon is null", () => {
    const SequencesView = makeSequencesView({ taxon: null });
    const { container } = render(<SequencesView />);
    expect(container.firstChild).toBeNull();
  });

  it("renders TaxonDataPanel with the genome_sequence cross-core join query", () => {
    // The query shape is the key discovery: genome_sequence has no
    // taxon_lineage_ids field, so it must join to the genome core. Assert the
    // join fragments — a test that only checked for "1234" would pass the
    // known-bad eq(taxon_lineage_ids,1234) applied directly to genome_sequence.
    const SequencesView = makeSequencesView({ taxon: fakeTaxon });
    const { getByTestId } = render(<SequencesView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "genome_sequence");
    const q = panel.getAttribute("data-q") ?? "";
    expect(q).toContain("eq(genome_id,*)");
    expect(q).toContain("genome(and(eq(taxon_lineage_ids,1234),ne(genome_status,Deprecated)))");
  });

  it("passes the sequences guide URL", () => {
    const SequencesView = makeSequencesView({ taxon: fakeTaxon });
    const { getByTestId } = render(<SequencesView />);
    expect(getByTestId("taxon-data-panel").getAttribute("data-guide")).toContain(
      "sequences.html",
    );
  });
});
