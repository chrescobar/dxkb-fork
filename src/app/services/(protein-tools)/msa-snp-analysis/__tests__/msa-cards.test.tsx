import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, useStore } from "@tanstack/react-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { MsaSelectSequencesCard } from "@/app/services/(protein-tools)/msa-snp-analysis/msa-select-sequences-card";
import { MsaStartWithCard } from "@/app/services/(protein-tools)/msa-snp-analysis/msa-start-with-card";
import { MsaParametersCard } from "@/app/services/(protein-tools)/msa-snp-analysis/msa-parameters-card";
import { MsaReferenceSequenceCard } from "@/app/services/(protein-tools)/msa-snp-analysis/msa-reference-sequence-card";

const { mockState } = vi.hoisted(() => ({
  mockState: { workspacePath: "/user/test-path" },
}));

vi.mock("@/components/workspace/workspace-object-selector", () => ({
  WorkspaceObjectSelector: ({
    value,
    onObjectSelect,
    onSelectedObjectChange,
    placeholder,
  }: {
    value?: string;
    onObjectSelect?: (obj: { path: string }) => void;
    onSelectedObjectChange?: (obj: { path: string } | null) => void;
    placeholder?: string;
  }) => (
    <button
      type="button"
      data-testid="workspace-selector"
      onClick={() => {
        const obj = { path: mockState.workspacePath };
        onObjectSelect?.(obj);
        onSelectedObjectChange?.(obj);
      }}
    >
      {value || placeholder}
    </button>
  ),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={makeQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

// ── MsaSelectSequencesCard ────────────────────────────────────────────────────

function MsaSelectSequencesWrapper({
  inputStatus = "unaligned",
  initialInputType = "input_feature_group" as const,
  onInputTypeChange = vi.fn(),
}: {
  inputStatus?: string;
  initialInputType?: "input_feature_group" | "input_genome_group" | "input_fasta" | "input_sequence";
  onInputTypeChange?: (prev: string | undefined, next: string) => void;
}) {
  const form = useForm({
    defaultValues: {
      input_status: inputStatus,
      input_type: initialInputType,
      feature_groups: "",
      select_genomegroup: [] as string[],
      fasta_files: [] as { file: string; type: string }[],
      fasta_keyboard_input: "",
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fastaFiles = useStore(form.store, (s: any) => s.values.fasta_files as { file: string; type: string }[]);
  return (
    <Wrapper>
      <MsaSelectSequencesCard
        form={form as never}
        inputStatus={inputStatus}
        fastaInputText=""
        setFastaInputText={vi.fn()}
        fastaValidationResult={null}
        selectedFastaObject={null}
        setSelectedFastaObject={vi.fn()}
        selectedAlignedFastaObject={null}
        setSelectedAlignedFastaObject={vi.fn()}
        isValidatingGenomeGroup={false}
        selectGenomegroup={[]}
        onGenomeGroupSelect={vi.fn()}
        onInputTypeChange={onInputTypeChange}
      />
      {/* Expose fasta_files state for test assertions without module-scope mutation */}
      <span data-testid="fasta-files-type">{fastaFiles?.[0]?.type ?? ""}</span>
    </Wrapper>
  );
}

describe("MsaSelectSequencesCard", () => {
  beforeEach(() => {
    mockState.workspacePath = "/user/test-path";
  });

  it("renders the four input-type radio options when status is unaligned", () => {
    render(<MsaSelectSequencesWrapper />);

    expect(screen.getByRole("radio", { name: /feature group/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /viral genome group/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /dna or protein fasta file/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /input sequence/i })).toBeInTheDocument();
  });

  it("shows the feature-group workspace selector when inputType is input_feature_group", () => {
    render(<MsaSelectSequencesWrapper initialInputType="input_feature_group" />);

    expect(screen.getByTestId("workspace-selector")).toBeInTheDocument();
  });

  it("shows the FASTA file workspace selector when inputType is input_fasta", () => {
    render(<MsaSelectSequencesWrapper initialInputType="input_fasta" />);

    expect(
      screen.getByRole("button", { name: /select fasta file/i }),
    ).toBeInTheDocument();
  });

  it("shows the genome-group workspace selector when inputType is input_genome_group", () => {
    render(<MsaSelectSequencesWrapper initialInputType="input_genome_group" />);

    expect(
      screen.getByRole("button", { name: /select viral genome group/i }),
    ).toBeInTheDocument();
  });

  it("shows the sequence textarea when inputType is input_sequence", () => {
    render(<MsaSelectSequencesWrapper initialInputType="input_sequence" />);

    expect(
      screen.getByPlaceholderText(/enter fasta records/i),
    ).toBeInTheDocument();
  });

  it("calls onInputTypeChange with (prevType, newType) when radio changes", async () => {
    const user = userEvent.setup();
    const onInputTypeChange = vi.fn();
    render(
      <MsaSelectSequencesWrapper
        initialInputType="input_feature_group"
        onInputTypeChange={onInputTypeChange}
      />,
    );

    await user.click(screen.getByRole("radio", { name: /dna or protein fasta file/i }));

    expect(onInputTypeChange).toHaveBeenCalledWith(
      "input_feature_group",
      "input_fasta",
    );
  });

  it("defaults to feature_dna_fasta for a generic FASTA path", async () => {
    const user = userEvent.setup();
    render(<MsaSelectSequencesWrapper initialInputType="input_fasta" />);

    await user.click(screen.getByTestId("workspace-selector"));

    expect(screen.getByTestId("fasta-files-type")).toHaveTextContent("feature_dna_fasta");
  });

  it("detects protein type from path and writes feature_protein_fasta to fasta_files", async () => {
    mockState.workspacePath = "/user/my-protein-sequences.fasta";
    const user = userEvent.setup();
    render(<MsaSelectSequencesWrapper initialInputType="input_fasta" />);

    await user.click(screen.getByTestId("workspace-selector"));

    expect(screen.getByTestId("fasta-files-type")).toHaveTextContent("feature_protein_fasta");
  });

  it("renders the aligned FASTA file selector when status is aligned", () => {
    render(<MsaSelectSequencesWrapper inputStatus="aligned" />);

    expect(
      screen.queryByRole("radio", { name: /feature group/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/select an aligned fasta file/i),
    ).toBeInTheDocument();
  });
});

// ── MsaStartWithCard ──────────────────────────────────────────────────────────

function MsaStartWithCardWrapper({
  onStatusChange = vi.fn(),
}: {
  onStatusChange?: (prev: string, next: string) => void;
}) {
  const form = useForm({
    defaultValues: { input_status: "unaligned" as const },
  });
  return (
    <Wrapper>
      <MsaStartWithCard form={form as never} onStatusChange={onStatusChange} />
    </Wrapper>
  );
}

describe("MsaStartWithCard", () => {

  it("renders Unaligned Sequences and Aligned Sequences radio options", () => {
    render(<MsaStartWithCardWrapper />);

    expect(screen.getByRole("radio", { name: /^unaligned sequences$/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /^aligned sequences$/i })).toBeInTheDocument();
  });

  it("calls onStatusChange with (prevStatus, newStatus) when toggled", async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    render(<MsaStartWithCardWrapper onStatusChange={onStatusChange} />);

    await user.click(screen.getByRole("radio", { name: /^aligned sequences$/i }));

    expect(onStatusChange).toHaveBeenCalledWith("unaligned", "aligned");
  });
});

// ── MsaParametersCard ─────────────────────────────────────────────────────────

function MsaParametersCardWrapper({
  showStrategy = false,
  inputStatus = "unaligned",
}: {
  showStrategy?: boolean;
  inputStatus?: string;
}) {
  const form = useForm({
    defaultValues: {
      aligner: "Mafft" as const,
      strategy: "auto",
      output_path: "",
      output_file: "",
    },
  });
  return (
    <Wrapper>
      <MsaParametersCard
        form={form as never}
        inputStatus={inputStatus}
        showStrategy={showStrategy}
        setShowStrategy={vi.fn()}
        onAlignerChange={vi.fn()}
      />
    </Wrapper>
  );
}

describe("MsaParametersCard", () => {
  it("renders the aligner select", () => {
    render(<MsaParametersCardWrapper />);

    expect(screen.getByText("Aligner")).toBeInTheDocument();
    expect(screen.getByText("Mafft")).toBeInTheDocument();
  });

  it("renders MSA strategy select when showStrategy is true", () => {
    render(<MsaParametersCardWrapper showStrategy={true} />);

    expect(screen.getByText(/strategy options/i)).toBeInTheDocument();
  });

  it("hides MSA strategy select when showStrategy is false", () => {
    render(<MsaParametersCardWrapper showStrategy={false} />);

    // Strategy Options trigger is still in DOM but collapsible content is hidden
    // Check that the strategy radio options are not visible
    const strategyContent = screen.queryByText(/^auto$/i);
    if (strategyContent) {
      expect(strategyContent).not.toBeVisible();
    }
  });

  it("renders output folder and output name fields via OutputLocationFields", () => {
    render(<MsaParametersCardWrapper />);

    expect(
      screen.getByPlaceholderText(/select output name/i),
    ).toBeInTheDocument();
  });
});

// ── MsaReferenceSequenceCard ──────────────────────────────────────────────────

import { toast } from "sonner";

function makeRefOptions(overrides: {
  refType?: string;
  featureOptions?: { feature_id: string; patric_id?: string; product?: string }[];
  genomeOptions?: { genome_id: string; genome_name: string }[];
  selectedFeatureId?: string;
  selectedGenomeId?: string;
  setSelectedFeatureId?: (id: string) => void;
  setSelectedGenomeId?: (id: string) => void;
}) {
  return {
    refType: overrides.refType ?? "none",
    featureOptions: overrides.featureOptions ?? [],
    genomeOptions: overrides.genomeOptions ?? [],
    selectedFeatureId: overrides.selectedFeatureId ?? "",
    selectedGenomeId: overrides.selectedGenomeId ?? "",
    setSelectedFeatureId: overrides.setSelectedFeatureId ?? vi.fn(),
    setSelectedGenomeId: overrides.setSelectedGenomeId ?? vi.fn(),
    isLoadingFeatures: false,
    isLoadingGenomes: false,
    reset: vi.fn(),
  };
}

function MsaRefCardWrapper({
  availableRefTypes = ["none", "feature_id", "genome_id", "string", "first"] as const,
  selectGenomegroup = [] as string[],
  referenceOptions = makeRefOptions({}),
  setReferenceFastaText = vi.fn(),
}: {
  availableRefTypes?: readonly string[];
  selectGenomegroup?: string[];
  referenceOptions?: ReturnType<typeof makeRefOptions>;
  setReferenceFastaText?: (text: string) => void;
}) {
  const form = useForm({
    defaultValues: {
      ref_type: referenceOptions.refType as "none" | "feature_id" | "genome_id" | "string" | "first",
      ref_string: "",
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refString = useStore(form.store, (s: any) => s.values.ref_string as string);
  return (
    <Wrapper>
      <MsaReferenceSequenceCard
        form={form as never}
        referenceOptions={referenceOptions as never}
        availableRefTypes={availableRefTypes as never}
        selectGenomegroup={selectGenomegroup}
        referenceFastaText=""
        setReferenceFastaText={setReferenceFastaText}
        referenceFastaValidationResult={null}
      />
      {/* Expose ref_string for test assertions without module-scope mutation */}
      <span data-testid="ref-string-value">{refString}</span>
    </Wrapper>
  );
}

describe("MsaReferenceSequenceCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders only the availableRefTypes as radio options", () => {
    render(
      <MsaRefCardWrapper
        availableRefTypes={["none", "feature_id"]}
        referenceOptions={makeRefOptions({ refType: "none" })}
      />,
    );

    expect(screen.getByRole("radio", { name: /^none$/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /feature id/i })).toBeInTheDocument();
    expect(screen.queryByText("Genome ID")).not.toBeInTheDocument();
  });

  it("shows feature dropdown when refType is feature_id and featureOptions is non-empty", async () => {
    const user = userEvent.setup();
    render(
      <MsaRefCardWrapper
        availableRefTypes={["none", "feature_id"]}
        referenceOptions={makeRefOptions({
          refType: "feature_id",
          featureOptions: [{ feature_id: "f1", product: "Protein A" }],
        })}
      />,
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    expect(await screen.findByText("f1")).toBeInTheDocument();
  });

  it("shows genome dropdown when refType is genome_id and genomeOptions is non-empty", async () => {
    const user = userEvent.setup();
    render(
      <MsaRefCardWrapper
        availableRefTypes={["none", "genome_id"]}
        referenceOptions={makeRefOptions({
          refType: "genome_id",
          genomeOptions: [{ genome_id: "g1", genome_name: "Genome One" }],
        })}
        selectGenomegroup={["/user/genome-group"]}
      />,
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    expect(await screen.findByText(/genome one/i)).toBeInTheDocument();
  });

  it("calls setSelectedFeatureId when a feature option is chosen", async () => {
    const user = userEvent.setup();
    const setSelectedFeatureId = vi.fn();
    render(
      <MsaRefCardWrapper
        availableRefTypes={["none", "feature_id"]}
        referenceOptions={makeRefOptions({
          refType: "feature_id",
          featureOptions: [{ feature_id: "f1", patric_id: "PATRIC.1", product: "Protein A" }],
          setSelectedFeatureId,
        })}
      />,
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    // Click the option by role to avoid pointer-events:none on inner text elements
    const option = await screen.findByRole("option", { name: /patric\.1/i });
    await user.click(option);

    expect(setSelectedFeatureId).toHaveBeenCalledWith("f1");
  });

  it("writes patric_id (not feature_id) to ref_string when feature has a patric_id", async () => {
    const user = userEvent.setup();
    render(
      <MsaRefCardWrapper
        availableRefTypes={["none", "feature_id"]}
        referenceOptions={makeRefOptions({
          refType: "feature_id",
          featureOptions: [{ feature_id: "f1", patric_id: "PATRIC.1", product: "X" }],
        })}
      />,
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: /patric\.1/i }));

    expect(screen.getByTestId("ref-string-value")).toHaveTextContent("PATRIC.1");
  });

  it("falls back to feature_id when patric_id is absent", async () => {
    const user = userEvent.setup();
    render(
      <MsaRefCardWrapper
        availableRefTypes={["none", "feature_id"]}
        referenceOptions={makeRefOptions({
          refType: "feature_id",
          featureOptions: [{ feature_id: "f2" }],
        })}
      />,
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: "f2" }));

    expect(screen.getByTestId("ref-string-value")).toHaveTextContent("f2");
  });

  it("clears ref_string and selectedFeatureId when switching from feature_id to none", async () => {
    const user = userEvent.setup();
    const setSelectedFeatureId = vi.fn();
    render(
      <MsaRefCardWrapper
        availableRefTypes={["none", "feature_id"]}
        referenceOptions={makeRefOptions({
          refType: "feature_id",
          setSelectedFeatureId,
        })}
      />,
    );

    await user.click(screen.getByRole("radio", { name: /^none$/i }));

    expect(screen.getByTestId("ref-string-value")).toHaveTextContent("");
    expect(setSelectedFeatureId).toHaveBeenCalledWith("");
  });

  it("clears ref_string when switching to first", async () => {
    const user = userEvent.setup();
    render(
      <MsaRefCardWrapper
        availableRefTypes={["none", "first", "string"]}
        referenceOptions={makeRefOptions({ refType: "string" })}
      />,
    );

    await user.click(screen.getByRole("radio", { name: /first sequence/i }));

    expect(screen.getByTestId("ref-string-value")).toHaveTextContent("");
  });

  it("shows the Genome Group required toast when genome-id dropdown is opened without a genome group", async () => {
    const user = userEvent.setup();
    render(
      <MsaRefCardWrapper
        availableRefTypes={["none", "genome_id"]}
        referenceOptions={makeRefOptions({ refType: "genome_id" })}
        selectGenomegroup={[]}
      />,
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/genome group required/i),
        expect.any(Object),
      );
    });
  });
});
