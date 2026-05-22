import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { http, HttpResponse } from "msw";
import { server } from "@/test-helpers/msw-server";
import { ServicePageProviders } from "@/test-helpers/service-page-providers";
import { installServicePageBaseline } from "@/test-helpers/service-page-mocks";
import { ProteomeComparisonParametersCard } from "../proteome-comparison-parameters-card";
import { ProteomeComparisonReferenceGenomeCard } from "../proteome-comparison-reference-genome-card";
import { ProteomeComparisonComparisonGenomesCard } from "../proteome-comparison-comparison-genomes-card";
import {
  defaultProteomeComparisonFormValues,
  maxComparisonGenomes,
  type ProteomeComparisonFormData,
  type ComparisonItem,
} from "@/lib/forms/(protein-tools)/proteome-comparison/proteome-comparison-form-schema";

vi.mock("@/components/workspace/workspace-object-selector", () => ({
  WorkspaceObjectSelector: ({ placeholder }: { placeholder: string }) => (
    <input data-testid="workspace-selector" placeholder={placeholder} readOnly />
  ),
}));

vi.mock("@/components/services/single-genome-selector", () => ({
  SingleGenomeSelector: ({ placeholder, onChange }: { placeholder: string; onChange: (id: string) => void }) => (
    <input
      data-testid="genome-selector"
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ServicePageProviders>{children}</ServicePageProviders>;
}

// ── ProteomeComparisonParametersCard ─────────────────────────────────────────

function ParametersCardWrapper({ showAdvanced = false }: { showAdvanced?: boolean }) {
  const form = useForm({ defaultValues: defaultProteomeComparisonFormValues as ProteomeComparisonFormData });
  return (
    <Wrapper>
      <ProteomeComparisonParametersCard
        form={form as never}
        showAdvancedParams={showAdvanced}
        onShowAdvancedChange={vi.fn()}
      />
    </Wrapper>
  );
}

describe("ProteomeComparisonParametersCard", () => {
  beforeEach(() => {
    installServicePageBaseline();
  });

  it("renders OutputLocationFields", () => {
    render(<ParametersCardWrapper />);
    expect(screen.getByPlaceholderText(/select output name/i)).toBeInTheDocument();
  });

  it("shows advanced collapsible trigger", () => {
    render(<ParametersCardWrapper />);
    expect(screen.getByText(/advanced parameters/i)).toBeInTheDocument();
  });

  it("reveals advanced fields when open", () => {
    render(<ParametersCardWrapper showAdvanced />);
    expect(screen.getByText(/minimum % coverage/i)).toBeInTheDocument();
    expect(screen.getByText(/blast e-value/i)).toBeInTheDocument();
    expect(screen.getByText(/minimum % identity/i)).toBeInTheDocument();
  });
});

// ── ProteomeComparisonReferenceGenomeCard ─────────────────────────────────────

function ReferenceCardWrapper({ onReferenceTypeChange = vi.fn() }: { onReferenceTypeChange?: (type: "genome" | "fasta" | "feature_group", value: string) => void }) {
  const form = useForm({ defaultValues: defaultProteomeComparisonFormValues as ProteomeComparisonFormData });
  return (
    <Wrapper>
      <ProteomeComparisonReferenceGenomeCard
        form={form as never}
        onReferenceTypeChange={onReferenceTypeChange}
      />
    </Wrapper>
  );
}

describe("ProteomeComparisonReferenceGenomeCard", () => {
  beforeEach(() => {
    installServicePageBaseline();
    server.use(
      http.get("*/api/services/genome/search", () => HttpResponse.json({ results: [] })),
    );
  });

  it("renders the three reference options", () => {
    render(<ReferenceCardWrapper />);
    expect(screen.getByText(/select a genome/i)).toBeInTheDocument();
    expect(screen.getByText(/protein fasta file/i)).toBeInTheDocument();
    expect(screen.getByText(/feature group/i)).toBeInTheDocument();
  });

  it("calls onReferenceTypeChange with 'genome' when genome selector changes", async () => {
    const user = userEvent.setup();
    const onReferenceTypeChange = vi.fn();
    render(<ReferenceCardWrapper onReferenceTypeChange={onReferenceTypeChange} />);
    const genomeInput = screen.getByTestId("genome-selector");
    await user.type(genomeInput, "12345.6");
    expect(onReferenceTypeChange).toHaveBeenCalledWith("genome", expect.any(String));
  });
});

// ── ProteomeComparisonComparisonGenomesCard ───────────────────────────────────

function ComparisonCardWrapper({
  comparisonItems = [],
  totalGenomeCount = 0,
}: {
  comparisonItems?: ComparisonItem[];
  totalGenomeCount?: number;
}) {
  const form = useForm({ defaultValues: defaultProteomeComparisonFormValues as ProteomeComparisonFormData });
  return (
    <Wrapper>
      <ProteomeComparisonComparisonGenomesCard
        form={form as never}
        selectedCompGenomeId=""
        setSelectedCompGenomeId={vi.fn()}
        selectedCompFasta={null}
        setSelectedCompFasta={vi.fn()}
        selectedCompFeatureGroup={null}
        setSelectedCompFeatureGroup={vi.fn()}
        selectedCompGenomeGroup={null}
        setSelectedCompGenomeGroup={vi.fn()}
        isLoadingGenomeGroup={false}
        isLoadingCompGenome={false}
        comparisonItems={comparisonItems}
        totalGenomeCount={totalGenomeCount}
        onAddCompGenome={vi.fn()}
        onAddCompFasta={vi.fn()}
        onAddCompFeatureGroup={vi.fn()}
        onAddCompGenomeGroup={vi.fn()}
        onRemoveComparisonItem={vi.fn()}
      />
    </Wrapper>
  );
}

describe("ProteomeComparisonComparisonGenomesCard", () => {
  beforeEach(() => {
    installServicePageBaseline();
  });

  it("renders all four input sections", () => {
    render(<ComparisonCardWrapper />);
    expect(screen.getByText(/select genome$/i)).toBeInTheDocument();
    expect(screen.getByText(/protein fasta file/i)).toBeInTheDocument();
    expect(screen.getByText(/feature group/i)).toBeInTheDocument();
    expect(screen.getByText(/genome group/i)).toBeInTheDocument();
  });

  it("shows genome count", () => {
    render(<ComparisonCardWrapper totalGenomeCount={3} />);
    expect(screen.getByText(`3 / ${maxComparisonGenomes} genome(s) selected`)).toBeInTheDocument();
  });

  it("disables add buttons when totalGenomeCount reaches max", () => {
    render(<ComparisonCardWrapper totalGenomeCount={maxComparisonGenomes} />);
    // The 4 Plus icon buttons (genome, fasta, feature group, genome group) should all be disabled.
    // Use size="icon" aria-label absence to distinguish from dialog triggers — just check by index
    // after filtering by variant (all icon-sized buttons in the card).
    const plusButtons = screen.getAllByRole("button", { name: "" }).filter(
      (btn) => btn.querySelector("svg"),
    );
    expect(plusButtons.length).toBeGreaterThanOrEqual(4);
    plusButtons.slice(0, 4).forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("renders selected items table when items are present", () => {
    const items: ComparisonItem[] = [
      { id: "g1", type: "genome", name: "E. coli K-12", genome_id: "511145.12" },
    ];
    render(<ComparisonCardWrapper comparisonItems={items} totalGenomeCount={1} />);
    expect(screen.getByText("E. coli K-12")).toBeInTheDocument();
  });
});
