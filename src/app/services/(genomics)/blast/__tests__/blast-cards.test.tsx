import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { BlastSearchProgramCard } from "@/app/services/(genomics)/blast/blast-search-program-card";
import { BlastInputSourceCard } from "@/app/services/(genomics)/blast/blast-input-source-card";
import { BlastParametersCard } from "@/app/services/(genomics)/blast/blast-parameters-card";

vi.mock("@/components/services/fasta-textarea", () => ({
  FastaTextarea: ({ value }: { value: string }) => (
    <textarea data-testid="fasta-textarea" defaultValue={value} />
  ),
}));

vi.mock("@/components/workspace/workspace-object-selector", () => ({
  WorkspaceObjectSelector: ({
    value,
    onObjectSelect,
    placeholder,
  }: {
    value?: string;
    onObjectSelect?: (obj: { path: string }) => void;
    placeholder?: string;
  }) => (
    <button
      type="button"
      data-testid="workspace-selector"
      onClick={() => onObjectSelect?.({ path: "/user/test-path" })}
    >
      {value || placeholder}
    </button>
  ),
}));

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

// ── BlastSearchProgramCard ────────────────────────────────────────────────────

function BlastSearchProgramCardWrapper() {
  const form = useForm({
    defaultValues: { blast_program: "blastn" as const },
  });
  return (
    <QueryClientProvider client={makeQueryClient()}>
      <BlastSearchProgramCard form={form as never} />
    </QueryClientProvider>
  );
}

describe("BlastSearchProgramCard", () => {
  it("renders all four BLAST program radio options", () => {
    render(<BlastSearchProgramCardWrapper />);

    // Use exact label text to avoid /blastn/i matching tBLASTn
    expect(screen.getByRole("radio", { name: /^BLASTN/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /^BLASTP/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /^BLASTX/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /^tBLASTn/i })).toBeInTheDocument();
  });

  it("selecting a radio updates the form field", async () => {
    const user = userEvent.setup();
    render(<BlastSearchProgramCardWrapper />);

    await user.click(screen.getByRole("radio", { name: /^BLASTP/i }));

    expect(screen.getByRole("radio", { name: /^BLASTP/i })).toBeChecked();
  });
});

// ── BlastInputSourceCard ──────────────────────────────────────────────────────

function BlastInputSourceCardWrapper({
  inputSource,
  onInputSourceChange = vi.fn(),
}: {
  inputSource: "fasta_data" | "fasta_file" | "feature_group";
  onInputSourceChange?: (s: "fasta_data" | "fasta_file" | "feature_group") => void;
}) {
  const form = useForm({
    defaultValues: {
      input_source: inputSource,
      input_fasta_data: "",
      input_fasta_file: "",
      input_feature_group: "",
    },
  });
  return (
    <QueryClientProvider client={makeQueryClient()}>
      <BlastInputSourceCard
        form={form as never}
        inputSource={inputSource}
        inputFastaPreset="unspecified"
        currentBlastProgram="blastn"
        onInputSourceChange={onInputSourceChange}
        onFastaValidationChange={vi.fn()}
      />
    </QueryClientProvider>
  );
}

describe("BlastInputSourceCard", () => {
  it("renders three input source options", () => {
    render(<BlastInputSourceCardWrapper inputSource="fasta_data" />);

    expect(screen.getByRole("radio", { name: /enter sequence/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /select fasta file/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /select feature group/i })).toBeInTheDocument();
  });

  it("shows FASTA textarea section when inputSource is fasta_data", () => {
    render(<BlastInputSourceCardWrapper inputSource="fasta_data" />);

    expect(screen.getByTestId("fasta-textarea")).toBeInTheDocument();
  });

  it("shows file selector section when inputSource is fasta_file", () => {
    render(<BlastInputSourceCardWrapper inputSource="fasta_file" />);

    const selectors = screen.getAllByTestId("workspace-selector");
    expect(selectors.length).toBeGreaterThan(0);
  });

  it("shows feature group selector when inputSource is feature_group", () => {
    render(<BlastInputSourceCardWrapper inputSource="feature_group" />);

    expect(
      screen.getByRole("button", { name: /select a feature group to search/i }),
    ).toBeInTheDocument();
  });

  it("calls onInputSourceChange when radio changes", async () => {
    const user = userEvent.setup();
    const onInputSourceChange = vi.fn();
    render(
      <BlastInputSourceCardWrapper
        inputSource="fasta_data"
        onInputSourceChange={onInputSourceChange}
      />,
    );

    await user.click(screen.getByRole("radio", { name: /select fasta file/i }));

    expect(onInputSourceChange).toHaveBeenCalledWith("fasta_file");
  });
});

// ── BlastParametersCard ───────────────────────────────────────────────────────

function BlastParametersCardWrapper({
  showAdvanced = false,
  onShowAdvancedChange = vi.fn(),
  onDatabaseSourceChange = vi.fn(),
  dbPrecomputedDatabase = "bacteria-archaea" as const,
}: {
  showAdvanced?: boolean;
  onShowAdvancedChange?: (open: boolean) => void;
  onDatabaseSourceChange?: (db: string) => void;
  dbPrecomputedDatabase?: "bacteria-archaea" | "viral-reference" | "selGenome" | "selGroup" | "selFeatureGroup" | "selTaxon" | "selFasta";
}) {
  const form = useForm({
    defaultValues: {
      db_precomputed_database: dbPrecomputedDatabase,
      db_type: "fna" as const,
      blast_max_hits: 10,
      blast_evalue_cutoff: 0.0001,
      output_file: "",
      output_path: "",
    },
  });
  return (
    <QueryClientProvider client={makeQueryClient()}>
      <BlastParametersCard
        form={form as never}
        dbPrecomputedDatabase={dbPrecomputedDatabase}
        availableDatabaseTypes={[
          { value: "fna", label: "Genome" },
          { value: "ffn", label: "Feature" },
        ]}
        currentBlastProgram="blastn"
        dbFastaPreset="unspecified"
        showAdvanced={showAdvanced}
        onShowAdvancedChange={onShowAdvancedChange}
        onDatabaseSourceChange={onDatabaseSourceChange as never}
      />
    </QueryClientProvider>
  );
}

describe("BlastParametersCard", () => {
  it("renders Database Source and Database Type selects", () => {
    render(<BlastParametersCardWrapper />);

    expect(screen.getByText("Database Source")).toBeInTheDocument();
    expect(screen.getByText("Database Type")).toBeInTheDocument();
  });

  it("calls onDatabaseSourceChange when Database Source changes", async () => {
    const user = userEvent.setup();
    const onDatabaseSourceChange = vi.fn();
    render(
      <BlastParametersCardWrapper onDatabaseSourceChange={onDatabaseSourceChange} />,
    );

    const triggers = screen.getAllByRole("combobox");
    await user.click(triggers[0]);
    const option = await screen.findByText(
      /reference and representative genomes \(viruses\)/i,
    );
    await user.click(option);

    expect(onDatabaseSourceChange).toHaveBeenCalledWith("viral-reference");
  });

  it("Advanced Options collapsible is closed by default", () => {
    render(<BlastParametersCardWrapper showAdvanced={false} />);

    const el = screen.queryByText("Max Hits");
    expect(el).not.toBeVisible();
  });

  it("Advanced Options collapsible opens when showAdvanced is true", () => {
    render(<BlastParametersCardWrapper showAdvanced={true} />);

    expect(screen.getByText("Max Hits")).toBeInTheDocument();
    expect(screen.getByText("E-Value Threshold")).toBeInTheDocument();
  });

  it("calls onShowAdvancedChange when trigger is clicked", async () => {
    const user = userEvent.setup();
    const onShowAdvancedChange = vi.fn();
    render(
      <BlastParametersCardWrapper onShowAdvancedChange={onShowAdvancedChange} />,
    );

    await user.click(screen.getByText("Advanced Options"));

    expect(onShowAdvancedChange).toHaveBeenCalledWith(true, expect.anything());
  });
});
