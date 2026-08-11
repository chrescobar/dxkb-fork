import { fireEvent, render, screen } from "@testing-library/react";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import { makeStrainsView } from "@/components/organisms/taxon-views/strains";
import { makeSerologyView } from "@/components/organisms/taxon-views/serology";
import { makeSurveillanceView } from "@/components/organisms/taxon-views/surveillance";
import { makeGenomesView } from "@/components/organisms/taxon-views/genomes";
import { makeSequencesView } from "@/components/organisms/taxon-views/sequences";
import { makeProteinStructuresView } from "@/components/organisms/taxon-views/protein-structures";
import { makeDomainsAndMotifsView } from "@/components/organisms/taxon-views/domains-and-motifs";
import { makeFeaturesView } from "@/components/organisms/taxon-views/features";
import { makeEpitopesView } from "@/components/organisms/taxon-views/epitopes";
import { makeExperimentsView } from "@/components/organisms/taxon-views/experiments";
import { makeInteractionsView } from "@/components/organisms/taxon-views/interactions";

// TaxonDataPanel has complex network + React dependencies; mock it so tests stay
// focused on the factory guard logic (null taxon → render nothing).
vi.mock("@/components/organisms/taxon-views/taxon-data-panel", () => ({
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
const scope = { kind: "lineage" as const, taxon: fakeTaxon };
const compositeScope = {
  kind: "composite" as const,
  displayName: "All Organisms",
  roots: [
    { ...fakeTaxon, taxonId: 131567, taxonName: "cellular organisms" },
    { ...fakeTaxon, taxonId: 10239, taxonName: "Viruses" },
  ],
};
const compositeClause = "or(eq(taxon_lineage_ids,131567),eq(taxon_lineage_ids,10239))";

describe("makeStrainsView", () => {
  it("renders TaxonDataPanel with strain resource and taxon query", () => {
    const StrainsView = makeStrainsView({ scope });
    const { getByTestId } = render(<StrainsView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "strain");
    expect(panel.getAttribute("data-q")).toContain("1234");
  });
});

describe("makeSerologyView", () => {
  it("renders TaxonDataPanel with serology resource and taxon query", () => {
    const SerologyView = makeSerologyView({ scope });
    const { getByTestId } = render(<SerologyView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "serology");
    expect(panel.getAttribute("data-q")).toContain("1234");
  });

  it("passes the serology guide URL", () => {
    const SerologyView = makeSerologyView({ scope });
    const { getByTestId } = render(<SerologyView />);
    expect(getByTestId("taxon-data-panel").getAttribute("data-guide")).toBe(
      "https://www.bv-brc.org/docs/quick_references/organisms_taxon/serology_data.html",
    );
  });
});

describe("makeSurveillanceView", () => {
  it("renders TaxonDataPanel with surveillance resource and taxon query", () => {
    const SurveillanceView = makeSurveillanceView({ scope });
    const { getByTestId } = render(<SurveillanceView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "surveillance");
    expect(panel.getAttribute("data-q")).toContain("1234");
  });

  it("passes the surveillance guide URL", () => {
    const SurveillanceView = makeSurveillanceView({ scope });
    const { getByTestId } = render(<SurveillanceView />);
    expect(getByTestId("taxon-data-panel").getAttribute("data-guide")).toBe(
      "https://www.bv-brc.org/docs/quick_references/organisms_taxon/surveillance_data.html",
    );
  });
});

describe("makeGenomesView", () => {
  it("renders TaxonDataPanel with genome resource and taxon query", () => {
    const GenomesView = makeGenomesView({ scope });
    const { getByTestId } = render(<GenomesView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "genome");
    expect(panel.getAttribute("data-q")).toContain("1234");
  });
});

describe("makeSequencesView", () => {
  it("renders TaxonDataPanel with the genome_sequence cross-core join query", () => {
    // The query shape is the key discovery: genome_sequence has no
    // taxon_lineage_ids field, so it must join to the genome core. Assert the
    // join fragments — a test that only checked for "1234" would pass the
    // known-bad eq(taxon_lineage_ids,1234) applied directly to genome_sequence.
    const SequencesView = makeSequencesView({ scope });
    const { getByTestId } = render(<SequencesView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "genome_sequence");
    const q = panel.getAttribute("data-q") ?? "";
    expect(q).toContain("eq(genome_id,*)");
    expect(q).toContain("genome(and(eq(taxon_lineage_ids,1234),ne(genome_status,Deprecated)))");
  });

  it("passes the sequences guide URL", () => {
    const SequencesView = makeSequencesView({ scope });
    const { getByTestId } = render(<SequencesView />);
    expect(getByTestId("taxon-data-panel").getAttribute("data-guide")).toContain(
      "sequences.html",
    );
  });
});

describe("makeProteinStructuresView", () => {
  it("renders TaxonDataPanel with the protein_structure cross-core join query", () => {
    const ProteinStructuresView = makeProteinStructuresView({ scope });
    const { getByTestId } = render(<ProteinStructuresView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "protein_structure");
    const q = panel.getAttribute("data-q") ?? "";
    expect(q).toContain("eq(genome_id,*)");
    expect(q).toContain("genome(and(eq(taxon_lineage_ids,1234),ne(genome_status,Deprecated)))");
  });

  it("passes the protein structures guide URL", () => {
    const ProteinStructuresView = makeProteinStructuresView({ scope });
    const { getByTestId } = render(<ProteinStructuresView />);
    expect(getByTestId("taxon-data-panel").getAttribute("data-guide")).toBe(
      "https://www.bv-brc.org/docs/quick_references/organisms_taxon/protein_structures.html",
    );
  });
});

describe("makeDomainsAndMotifsView", () => {
  it("renders TaxonDataPanel with the protein_feature cross-core join query", () => {
    const DomainsAndMotifsView = makeDomainsAndMotifsView({ scope });
    const { getByTestId } = render(<DomainsAndMotifsView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "protein_feature");
    const q = panel.getAttribute("data-q") ?? "";
    expect(q).toContain("eq(genome_id,*)");
    expect(q).toContain("genome(eq(taxon_lineage_ids,1234))");
  });

  it("passes the domains and motifs guide URL", () => {
    const DomainsAndMotifsView = makeDomainsAndMotifsView({ scope });
    const { getByTestId } = render(<DomainsAndMotifsView />);
    expect(getByTestId("taxon-data-panel").getAttribute("data-guide")).toBe(
      "https://www.bv-brc.org/docs/quick_references/organisms_taxon/domains_and_motifs.html",
    );
  });
});

describe("makeFeaturesView", () => {
  it("renders TaxonDataPanel with the genome_feature cross-core join query", () => {
    // genome_feature has no taxon_lineage_ids field, so it joins to the genome
    // core (same shape as sequences). annotation=PATRIC is the legacy default
    // filter. resource must be exactly genome_feature — the id/field/action/
    // detail lookups are all keyed on it.
    const FeaturesView = makeFeaturesView({ scope });
    const { getByTestId } = render(<FeaturesView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "genome_feature");
    const q = panel.getAttribute("data-q") ?? "";
    expect(q).toContain("eq(genome_id,*)");
    expect(q).toContain("genome(and(eq(taxon_lineage_ids,1234),ne(genome_status,Deprecated)))");
    expect(q).toContain("eq(annotation,PATRIC)");
  });

  it("passes the features guide URL", () => {
    const FeaturesView = makeFeaturesView({ scope });
    const { getByTestId } = render(<FeaturesView />);
    expect(getByTestId("taxon-data-panel").getAttribute("data-guide")).toBe(
      "https://www.bv-brc.org/docs/quick_references/organisms_taxon/features.html",
    );
  });
});

describe("makeEpitopesView", () => {
  it("renders TaxonDataPanel with epitope resource and taxon query", () => {
    const EpitopesView = makeEpitopesView({ scope });
    const { getByTestId } = render(<EpitopesView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "epitope");
    expect(panel.getAttribute("data-q")).toContain("1234");
  });

  it("passes the epitopes guide URL", () => {
    const EpitopesView = makeEpitopesView({ scope });
    const { getByTestId } = render(<EpitopesView />);
    expect(getByTestId("taxon-data-panel").getAttribute("data-guide")).toBe(
      "https://www.bv-brc.org/docs/quick_references/organisms_taxon/epitopes.html",
    );
  });
});

describe("makeExperimentsView", () => {
  it("renders the experiment panel by default", () => {
    const ExperimentsView = makeExperimentsView({ scope });
    const { getByTestId } = render(<ExperimentsView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "experiment");
    expect(panel.getAttribute("data-q")).toBe("eq(taxon_lineage_ids,1234)");
    expect(panel.getAttribute("data-guide")).toBe(
      "https://www.bv-brc.org/docs/quick_references/organisms_taxon/experiments.html",
    );
  });

  it("renders the bioset panel after selecting the Biosets sub-tab", () => {
    const ExperimentsView = makeExperimentsView({ scope });
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

describe("composite scope queries", () => {
  it.each([
    ["genome", makeGenomesView, compositeClause],
    [
      "genome_sequence",
      makeSequencesView,
      `and(eq(genome_id,*),genome(and(${compositeClause},ne(genome_status,Deprecated))))`,
    ],
    [
      "protein_structure",
      makeProteinStructuresView,
      `and(eq(genome_id,*),genome(and(${compositeClause},ne(genome_status,Deprecated))))`,
    ],
    [
      "protein_feature",
      makeDomainsAndMotifsView,
      `and(eq(genome_id,*),genome(${compositeClause}))`,
    ],
    [
      "genome_feature",
      makeFeaturesView,
      `and(eq(genome_id,*),genome(and(${compositeClause},ne(genome_status,Deprecated))),eq(annotation,PATRIC))`,
    ],
    ["strain", makeStrainsView, compositeClause],
    ["surveillance", makeSurveillanceView, compositeClause],
    ["serology", makeSerologyView, compositeClause],
    ["epitope", makeEpitopesView, compositeClause],
  ])("builds the exact %s query", (resource, makeView, expectedQuery) => {
    const View = makeView({ scope: compositeScope });
    render(<View />);

    expect(screen.getByTestId("taxon-data-panel")).toHaveAttribute("data-resource", resource);
    expect(screen.getByTestId("taxon-data-panel")).toHaveAttribute("data-q", expectedQuery);
  });

  it("applies the composite clause to both experiment subviews", () => {
    const View = makeExperimentsView({ scope: compositeScope });
    render(<View />);
    expect(screen.getByTestId("taxon-data-panel")).toHaveAttribute("data-q", compositeClause);

    fireEvent.click(screen.getByRole("tab", { name: "Biosets" }));
    expect(screen.getByTestId("taxon-data-panel")).toHaveAttribute(
      "data-q",
      `and(eq(genome_id,*),genome(${compositeClause}))`,
    );
  });
});

describe("makeInteractionsView", () => {
  it("renders TaxonDataPanel with the ppi cross-core join query", () => {
    const InteractionsView = makeInteractionsView({ scope });
    const { getByTestId } = render(<InteractionsView />);
    const panel = getByTestId("taxon-data-panel");
    expect(panel).toHaveAttribute("data-resource", "ppi");
    const q = panel.getAttribute("data-q") ?? "";
    expect(q).toContain("eq(genome_id_a,*)");
    expect(q).toContain("genome(to(genome_id_a),and(eq(taxon_lineage_ids,1234),ne(genome_status,Deprecated)))");
    expect(q).toContain("eq(evidence,experimental)");
  });

  it("passes the interactions guide URL", () => {
    const InteractionsView = makeInteractionsView({ scope });
    const { getByTestId } = render(<InteractionsView />);
    expect(getByTestId("taxon-data-panel").getAttribute("data-guide")).toBe(
      "https://www.bv-brc.org/docs/quick_references/organisms_taxon/interactions.html",
    );
  });
});
