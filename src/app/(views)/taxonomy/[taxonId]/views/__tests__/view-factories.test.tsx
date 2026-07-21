import { fireEvent, render, screen } from "@testing-library/react";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import { makeStrainsView } from "../strains";
import { makeSerologyView } from "../serology";
import { makeSurveillanceView } from "../surveillance";
import { makeGenomesView } from "../genomes";
import { makeSequencesView } from "../sequences";
import { makeProteinStructuresView } from "../protein-structures";
import { makeDomainsAndMotifsView } from "../domains-and-motifs";
import { makeFeaturesView } from "../features";
import { makeEpitopesView } from "../epitopes";
import { makeExperimentsView } from "../experiments";

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

  it("passes the serology guide URL", () => {
    const SerologyView = makeSerologyView({ taxon: fakeTaxon });
    const { getByTestId } = render(<SerologyView />);
    expect(getByTestId("taxon-data-panel").getAttribute("data-guide")).toBe(
      "https://www.bv-brc.org/docs/quick_references/organisms_taxon/serology_data.html",
    );
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

  it("passes the surveillance guide URL", () => {
    const SurveillanceView = makeSurveillanceView({ taxon: fakeTaxon });
    const { getByTestId } = render(<SurveillanceView />);
    expect(getByTestId("taxon-data-panel").getAttribute("data-guide")).toBe(
      "https://www.bv-brc.org/docs/quick_references/organisms_taxon/surveillance_data.html",
    );
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

describe("makeProteinStructuresView", () => {
  it("renders nothing when taxon is null", () => {
    const ProteinStructuresView = makeProteinStructuresView({ taxon: null });
    const { container } = render(<ProteinStructuresView />);
    expect(container.firstChild).toBeNull();
  });

  it("renders TaxonDataPanel with the protein_structure cross-core join query", () => {
    const ProteinStructuresView = makeProteinStructuresView({ taxon: fakeTaxon });
    const { getByTestId } = render(<ProteinStructuresView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "protein_structure");
    const q = panel.getAttribute("data-q") ?? "";
    expect(q).toContain("eq(genome_id,*)");
    expect(q).toContain("genome(and(eq(taxon_lineage_ids,1234),ne(genome_status,Deprecated)))");
  });

  it("passes the protein structures guide URL", () => {
    const ProteinStructuresView = makeProteinStructuresView({ taxon: fakeTaxon });
    const { getByTestId } = render(<ProteinStructuresView />);
    expect(getByTestId("taxon-data-panel").getAttribute("data-guide")).toBe(
      "https://www.bv-brc.org/docs/quick_references/organisms_taxon/protein_structures.html",
    );
  });
});

describe("makeDomainsAndMotifsView", () => {
  it("renders nothing when taxon is null", () => {
    const DomainsAndMotifsView = makeDomainsAndMotifsView({ taxon: null });
    const { container } = render(<DomainsAndMotifsView />);
    expect(container.firstChild).toBeNull();
  });

  it("renders TaxonDataPanel with the protein_feature cross-core join query", () => {
    const DomainsAndMotifsView = makeDomainsAndMotifsView({ taxon: fakeTaxon });
    const { getByTestId } = render(<DomainsAndMotifsView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "protein_feature");
    const q = panel.getAttribute("data-q") ?? "";
    expect(q).toContain("eq(genome_id,*)");
    expect(q).toContain("genome(eq(taxon_lineage_ids,1234))");
  });

  it("passes the domains and motifs guide URL", () => {
    const DomainsAndMotifsView = makeDomainsAndMotifsView({ taxon: fakeTaxon });
    const { getByTestId } = render(<DomainsAndMotifsView />);
    expect(getByTestId("taxon-data-panel").getAttribute("data-guide")).toBe(
      "https://www.bv-brc.org/docs/quick_references/organisms_taxon/domains_and_motifs.html",
    );
  });
});

describe("makeFeaturesView", () => {
  it("renders nothing when taxon is null", () => {
    const FeaturesView = makeFeaturesView({ taxon: null });
    const { container } = render(<FeaturesView />);
    expect(container.firstChild).toBeNull();
  });

  it("renders TaxonDataPanel with the genome_feature cross-core join query", () => {
    // genome_feature has no taxon_lineage_ids field, so it joins to the genome
    // core (same shape as sequences). annotation=PATRIC is the legacy default
    // filter. resource must be exactly genome_feature — the id/field/action/
    // detail lookups are all keyed on it.
    const FeaturesView = makeFeaturesView({ taxon: fakeTaxon });
    const { getByTestId } = render(<FeaturesView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "genome_feature");
    const q = panel.getAttribute("data-q") ?? "";
    expect(q).toContain("eq(genome_id,*)");
    expect(q).toContain("genome(and(eq(taxon_lineage_ids,1234),ne(genome_status,Deprecated)))");
    expect(q).toContain("eq(annotation,PATRIC)");
  });

  it("passes the features guide URL", () => {
    const FeaturesView = makeFeaturesView({ taxon: fakeTaxon });
    const { getByTestId } = render(<FeaturesView />);
    expect(getByTestId("taxon-data-panel").getAttribute("data-guide")).toBe(
      "https://www.bv-brc.org/docs/quick_references/organisms_taxon/features.html",
    );
  });
});

describe("makeEpitopesView", () => {
  it("renders nothing when taxon is null", () => {
    const EpitopesView = makeEpitopesView({ taxon: null });
    const { container } = render(<EpitopesView />);
    expect(container.firstChild).toBeNull();
  });

  it("renders TaxonDataPanel with epitope resource and taxon query", () => {
    const EpitopesView = makeEpitopesView({ taxon: fakeTaxon });
    const { getByTestId } = render(<EpitopesView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "epitope");
    expect(panel.getAttribute("data-q")).toContain("1234");
  });

  it("passes the epitopes guide URL", () => {
    const EpitopesView = makeEpitopesView({ taxon: fakeTaxon });
    const { getByTestId } = render(<EpitopesView />);
    expect(getByTestId("taxon-data-panel").getAttribute("data-guide")).toBe(
      "https://www.bv-brc.org/docs/quick_references/organisms_taxon/epitopes.html",
    );
  });
});

describe("makeExperimentsView", () => {
  it("renders nothing when taxon is null", () => {
    const ExperimentsView = makeExperimentsView({ taxon: null });
    const { container } = render(<ExperimentsView />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the experiment panel by default", () => {
    const ExperimentsView = makeExperimentsView({ taxon: fakeTaxon });
    const { getByTestId } = render(<ExperimentsView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "experiment");
    expect(panel.getAttribute("data-q")).toBe("eq(taxon_lineage_ids,1234)");
    expect(panel.getAttribute("data-guide")).toBe(
      "https://www.bv-brc.org/docs/quick_references/organisms_taxon/experiments.html",
    );
  });

  it("renders the bioset panel after selecting the Biosets sub-tab", () => {
    const ExperimentsView = makeExperimentsView({ taxon: fakeTaxon });
    const { getByTestId } = render(<ExperimentsView />);

    fireEvent.click(screen.getByRole("tab", { name: "Biosets" }));

    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "bioset");
    const q = panel.getAttribute("data-q") ?? "";
    expect(q).toContain("eq(genome_id,*)");
    expect(q).toContain("genome(eq(taxon_lineage_ids,1234))");
    expect(panel.getAttribute("data-guide")).toBeNull();
  });
});
