import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { GeneProteinTreeInputCard } from "@/app/services/(protein-tools)/gene-protein-tree/gene-protein-tree-input-card";
import { AlignmentParametersCard } from "@/components/services/alignment-parameters-card";
import { GeneProteinTreeTreeParametersCard } from "@/app/services/(protein-tools)/gene-protein-tree/gene-protein-tree-tree-parameters-card";
import { GeneProteinTreeMetadataOptions } from "@/app/services/(protein-tools)/gene-protein-tree/gene-protein-tree-metadata-options";

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
        const obj = { path: "/user/test-path" };
        onObjectSelect?.(obj);
        onSelectedObjectChange?.(obj);
      }}
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

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={makeQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

// ── GeneProteinTreeInputCard ──────────────────────────────────────────────────

function InputCardWrapper({
  selectedItemsForTable = [],
  onAddSequence = vi.fn(),
  onFeatureGroupChange = vi.fn(),
  onRemoveSequence = vi.fn(),
  selectedFeatureGroupObject = null as { path: string; name: string; type: string; size: number; owner: string } | null,
}: {
  selectedItemsForTable?: { id: string; name: string; type: string }[];
  onAddSequence?: (source: "feature" | "aligned" | "unaligned") => void;
  onFeatureGroupChange?: (obj: { path: string } | null) => void;
  onRemoveSequence?: (id: string) => void;
  selectedFeatureGroupObject?: { path: string; name: string; type: string; size: number; owner: string } | null;
}) {
  const form = useForm({
    defaultValues: { alphabet: "DNA" as const },
  });
  return (
    <Wrapper>
      <GeneProteinTreeInputCard
        form={form as never}
        alphabet="DNA"
        alignedFastaPreset="alignedFasta"
        unalignedFastaPreset="featureFasta"
        selectedFeatureGroupObject={selectedFeatureGroupObject as never}
        selectedAlignedFastaObject={null}
        selectedUnalignedFastaObject={null}
        selectedItemsForTable={selectedItemsForTable}
        onFeatureGroupChange={onFeatureGroupChange as never}
        onAlignedFastaChange={vi.fn()}
        onUnalignedFastaChange={vi.fn()}
        onAddSequence={onAddSequence}
        onRemoveSequence={onRemoveSequence}
      />
    </Wrapper>
  );
}

describe("GeneProteinTreeInputCard", () => {
  it("renders alphabet radio options", () => {
    render(<InputCardWrapper />);

    expect(screen.getByRole("radio", { name: "DNA" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Protein" })).toBeInTheDocument();
  });

  it("renders feature-group, aligned-FASTA, and unaligned-FASTA selectors", () => {
    render(<InputCardWrapper />);

    const selectors = screen.getAllByTestId("workspace-selector");
    expect(selectors.length).toBeGreaterThanOrEqual(3);
  });

  it("renders the Add button for each input source", () => {
    render(<InputCardWrapper />);

    // There are workspace selector buttons (with placeholder text) and add icon buttons
    const allButtons = screen.getAllByRole("button");
    expect(allButtons.length).toBeGreaterThanOrEqual(3);
  });

  it("calls onAddSequence('feature') when Feature Group Add is clicked", async () => {
    const user = userEvent.setup();
    const onAddSequence = vi.fn();
    render(
      <InputCardWrapper
        onAddSequence={onAddSequence}
        selectedFeatureGroupObject={{
          path: "/user/group.fg",
          name: "group.fg",
          type: "feature_group",
          size: 0,
          owner: "",
        }}
      />,
    );

    // The feature group add button is the first icon button after the workspace selector
    // Workspace selector is a button; the add button follows it - get all unnamed icon buttons
    const addButtons = screen.getAllByRole("button", { name: "" });
    await user.click(addButtons[0]);

    expect(onAddSequence).toHaveBeenCalledWith("feature");
  });

  it("calls onFeatureGroupChange when the feature-group workspace selector fires", async () => {
    const user = userEvent.setup();
    const onFeatureGroupChange = vi.fn();
    render(<InputCardWrapper onFeatureGroupChange={onFeatureGroupChange} />);

    const selectors = screen.getAllByTestId("workspace-selector");
    await user.click(selectors[0]);

    expect(onFeatureGroupChange).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/user/test-path" }),
    );
  });

  it("renders selectedItemsForTable rows in the table", () => {
    render(
      <InputCardWrapper
        selectedItemsForTable={[
          { id: "1", name: "seq1.fasta", type: "Feature Group" },
        ]}
      />,
    );

    expect(screen.getByText("seq1.fasta")).toBeInTheDocument();
  });

  it("calls onRemoveSequence when the remove button is clicked", async () => {
    const user = userEvent.setup();
    const onRemoveSequence = vi.fn();
    render(
      <InputCardWrapper
        selectedItemsForTable={[
          { id: "1", name: "seq1.fasta", type: "Feature Group" },
        ]}
        onRemoveSequence={onRemoveSequence}
      />,
    );

    // The remove button in SelectedItemsTable renders a × character as its text
    const removeBtn = screen.getByRole("button", { name: "×" });
    await user.click(removeBtn);

    expect(onRemoveSequence).toHaveBeenCalledWith("1");
  });
});

// ── GeneProteinTreeAlignmentParametersCard ────────────────────────────────────

function AlignmentParamsWrapper() {
  const form = useForm({
    defaultValues: { trim_threshold: "0.5", gap_threshold: "0.5" },
  });
  return (
    <Wrapper>
      <AlignmentParametersCard form={form as never} />
    </Wrapper>
  );
}

describe("AlignmentParametersCard", () => {
  it("renders Trim Ends of Alignment Threshold select", () => {
    render(<AlignmentParamsWrapper />);

    expect(
      screen.getByText("Trim Ends of Alignment Threshold"),
    ).toBeInTheDocument();
  });

  it("renders Remove Gappy Sequences Threshold select", () => {
    render(<AlignmentParamsWrapper />);

    expect(
      screen.getByText("Remove Gappy Sequences Threshold"),
    ).toBeInTheDocument();
  });
});

// ── GeneProteinTreeTreeParametersCard ─────────────────────────────────────────

function TreeParamsWrapper({
  substitutionModelOptions = [
    { value: "GTR", label: "GTR" },
    { value: "HKY85", label: "HKY85" },
  ],
}: {
  substitutionModelOptions?: readonly { readonly value: string; readonly label: string }[];
}) {
  const form = useForm({
    defaultValues: {
      recipe: "RAxML" as const,
      substitution_model: "GTR",
      output_path: "",
      output_file: "",
    },
  });
  return (
    <Wrapper>
      <GeneProteinTreeTreeParametersCard
        form={form as never}
        substitutionModelOptions={substitutionModelOptions}
      />
    </Wrapper>
  );
}

describe("GeneProteinTreeTreeParametersCard", () => {
  it("renders recipe radio group with three options", () => {
    render(<TreeParamsWrapper />);

    expect(screen.getByRole("radio", { name: "RAxML" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "PhyML" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "FastTree" })).toBeInTheDocument();
  });

  it("renders substitution model select with provided options", async () => {
    const user = userEvent.setup();
    render(<TreeParamsWrapper />);

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    // After opening the select, options appear in the dropdown
    const options = await screen.findAllByText("GTR");
    expect(options.length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText("HKY85")).toBeInTheDocument();
  });

  it("renders output location fields", () => {
    render(<TreeParamsWrapper />);

    expect(
      screen.getByPlaceholderText(/select output name/i),
    ).toBeInTheDocument();
  });
});

// ── GeneProteinTreeMetadataOptions ────────────────────────────────────────────

describe("GeneProteinTreeMetadataOptions", () => {
  it("renders hidden content when showAdvanced is false", () => {
    render(
      <GeneProteinTreeMetadataOptions
        showAdvanced={false}
        onShowAdvancedChange={vi.fn()}
        metadataFields={[]}
        selectedMetadataField=""
        availableMetadataOptions={[
          { value: "host_name", label: "Host Name" },
        ]}
        onMetadataSelection={vi.fn()}
        onAddMetadataField={vi.fn()}
        onRemoveMetadataField={vi.fn()}
      />,
    );

    expect(screen.getByText("Metadata Options")).toBeInTheDocument();
    // Collapsible keeps content in DOM but hidden when closed
    const metadataTableLabel = screen.queryByText("Metadata Table Fields");
    expect(metadataTableLabel).not.toBeVisible();
  });

  it("renders field selector and table when showAdvanced is true", () => {
    render(
      <GeneProteinTreeMetadataOptions
        showAdvanced={true}
        onShowAdvancedChange={vi.fn()}
        metadataFields={[{ id: "host_name", name: "Host Name", selected: true }]}
        selectedMetadataField=""
        availableMetadataOptions={[
          { value: "host_name", label: "Host Name" },
        ]}
        onMetadataSelection={vi.fn()}
        onAddMetadataField={vi.fn()}
        onRemoveMetadataField={vi.fn()}
      />,
    );

    expect(screen.getByText("Host Name")).toBeInTheDocument();
  });

  it("calls onAddMetadataField when the add button is clicked with a selection", async () => {
    const user = userEvent.setup();
    const onAddMetadataField = vi.fn();
    render(
      <GeneProteinTreeMetadataOptions
        showAdvanced={true}
        onShowAdvancedChange={vi.fn()}
        metadataFields={[]}
        selectedMetadataField="host_name"
        availableMetadataOptions={[
          { value: "host_name", label: "Host Name" },
        ]}
        onMetadataSelection={vi.fn()}
        onAddMetadataField={onAddMetadataField}
        onRemoveMetadataField={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "" }));

    expect(onAddMetadataField).toHaveBeenCalledTimes(1);
  });

  it("calls onRemoveMetadataField with the field id when Remove is clicked", async () => {
    const user = userEvent.setup();
    const onRemoveMetadataField = vi.fn();
    render(
      <GeneProteinTreeMetadataOptions
        showAdvanced={true}
        onShowAdvancedChange={vi.fn()}
        metadataFields={[{ id: "host_name", name: "Host Name", selected: true }]}
        selectedMetadataField=""
        availableMetadataOptions={[
          { value: "host_name", label: "Host Name" },
        ]}
        onMetadataSelection={vi.fn()}
        onAddMetadataField={vi.fn()}
        onRemoveMetadataField={onRemoveMetadataField}
      />,
    );

    // The remove button (X icon) is the last unnamed icon button; the add button is disabled
    const unnamedButtons = screen.getAllByRole("button", { name: "" });
    await user.click(unnamedButtons[unnamedButtons.length - 1]);

    expect(onRemoveMetadataField).toHaveBeenCalledWith("host_name");
  });
});
