import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TaxonomicClassificationParametersCard } from "@/app/services/(metagenomics)/taxonomic-classification/taxonomic-classification-parameters-card";

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

const defaultAnalysisTypeOptions = [
  { value: "default", label: "Microbiome Analysis" },
] as const;

const defaultDatabaseOptions = [
  { value: "bvbrc", label: "BV-BRC Database" },
] as const;

function ParametersCardWrapper({
  sequenceType = "wgs" as const,
  analysisTypeOptions = defaultAnalysisTypeOptions,
  databaseOptions = defaultDatabaseOptions,
}: {
  sequenceType?: "wgs" | "16s";
  analysisTypeOptions?: readonly { readonly value: string; readonly label: string }[];
  databaseOptions?: readonly { readonly value: string; readonly label: string }[];
}) {
  const form = useForm({
    defaultValues: {
      sequence_type: sequenceType,
      analysis_type: "default",
      database: "bvbrc",
      host_genome: "no_host",
      confidence_interval: "0.1",
      save_classified_sequences: "no",
      save_unclassified_sequences: "no",
      output_path: "",
      output_file: "",
    },
  });
  return (
    <Wrapper>
      <TaxonomicClassificationParametersCard
        form={form as never}
        sequenceType={sequenceType}
        analysisTypeOptions={analysisTypeOptions}
        databaseOptions={databaseOptions}
      />
    </Wrapper>
  );
}

describe("TaxonomicClassificationParametersCard", () => {
  it("renders Whole Genome Sequencing and 16S Ribosomal RNA radio options", () => {
    render(<ParametersCardWrapper />);

    expect(
      screen.getByRole("radio", { name: /whole genome sequencing/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /16s ribosomal rna/i })).toBeInTheDocument();
  });

  it("Analysis Type select is enabled when sequenceType is wgs", () => {
    render(<ParametersCardWrapper sequenceType="wgs" />);

    const triggers = screen.getAllByRole("combobox");
    const analysisTrigger = triggers[0];
    expect(analysisTrigger).not.toHaveAttribute("data-disabled");
  });

  it("Analysis Type select is disabled when sequenceType is 16s", () => {
    render(<ParametersCardWrapper sequenceType="16s" />);

    const triggers = screen.getAllByRole("combobox");
    const analysisTrigger = triggers[0];
    // base-ui uses data-disabled="" (empty string boolean attribute) when disabled
    expect(analysisTrigger).toHaveAttribute("data-disabled");
  });

  it("Filter Host Reads select is disabled when sequenceType is 16s", () => {
    render(<ParametersCardWrapper sequenceType="16s" />);

    const triggers = screen.getAllByRole("combobox");
    const hostTrigger = triggers[2];
    // base-ui uses data-disabled="" (empty string boolean attribute) when disabled
    expect(hostTrigger).toHaveAttribute("data-disabled");
  });

  it("renders all provided analysisTypeOptions in the Analysis Type select", async () => {
    const user = userEvent.setup();
    render(
      <ParametersCardWrapper
        sequenceType="wgs"
        analysisTypeOptions={[
          { value: "default", label: "Microbiome Analysis" },
          { value: "pathogen", label: "Species Identification" },
        ]}
      />,
    );

    const triggers = screen.getAllByRole("combobox");
    await user.click(triggers[0]);

    // After clicking the trigger, dropdown opens - check for option that only appears in dropdown
    expect(await screen.findByText("Species Identification")).toBeInTheDocument();
    // Microbiome Analysis may appear both as selected value and as dropdown option
    const microbiomeItems = await screen.findAllByText("Microbiome Analysis");
    expect(microbiomeItems.length).toBeGreaterThanOrEqual(1);
  });

  it("renders all provided databaseOptions in the Database select", async () => {
    const user = userEvent.setup();
    render(
      <ParametersCardWrapper
        databaseOptions={[
          { value: "bvbrc", label: "BV-BRC Database" },
          { value: "standard", label: "Kraken2 Standard" },
        ]}
      />,
    );

    const triggers = screen.getAllByRole("combobox");
    await user.click(triggers[1]);

    // After clicking the trigger, dropdown opens
    expect(await screen.findByText("Kraken2 Standard")).toBeInTheDocument();
    // BV-BRC Database may appear both as selected value and as dropdown option
    const bvbrcItems = await screen.findAllByText("BV-BRC Database");
    expect(bvbrcItems.length).toBeGreaterThanOrEqual(1);
  });

  it("renders Save Classified Sequences and Save Unclassified Sequences radio pairs", () => {
    render(<ParametersCardWrapper />);

    expect(
      screen.getByText(/save classified sequences/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/save unclassified sequences/i),
    ).toBeInTheDocument();
  });

  it("renders output location fields", () => {
    render(<ParametersCardWrapper />);

    expect(
      screen.getByPlaceholderText(/select output name/i),
    ).toBeInTheDocument();
  });
});
