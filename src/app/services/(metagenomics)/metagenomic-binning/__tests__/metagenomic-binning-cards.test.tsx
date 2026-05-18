import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { MetagenomicBinningStartWithCard } from "@/app/services/(metagenomics)/metagenomic-binning/metagenomic-binning-start-with-card";
import { MetagenomicBinningParametersCard } from "@/app/services/(metagenomics)/metagenomic-binning/metagenomic-binning-parameters-card";

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

// ── MetagenomicBinningStartWithCard ───────────────────────────────────────────

function StartWithWrapper() {
  const form = useForm({
    defaultValues: { start_with: "reads" as const },
  });
  return (
    <Wrapper>
      <MetagenomicBinningStartWithCard form={form as never} />
    </Wrapper>
  );
}

describe("MetagenomicBinningStartWithCard", () => {
  it("renders Read Files and Assembled Contigs radio options", () => {
    render(<StartWithWrapper />);

    expect(screen.getByRole("radio", { name: /read files/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /assembled contigs/i })).toBeInTheDocument();
  });

  it("selecting Assembled Contigs updates the form field", async () => {
    const user = userEvent.setup();
    render(<StartWithWrapper />);

    await user.click(screen.getByRole("radio", { name: /assembled contigs/i }));

    expect(screen.getByRole("radio", { name: /assembled contigs/i })).toBeChecked();
  });
});

// ── MetagenomicBinningParametersCard ──────────────────────────────────────────

function ParametersWrapper({
  startWith = "reads" as const,
  metaspadesDisabled = false,
  showAdvanced = false,
  onShowAdvancedChange = vi.fn(),
}: {
  startWith?: "reads" | "contigs";
  metaspadesDisabled?: boolean;
  showAdvanced?: boolean;
  onShowAdvancedChange?: (open: boolean) => void;
}) {
  const form = useForm({
    defaultValues: {
      assembler: "auto" as const,
      organism: "bacteria" as const,
      genome_group: "",
      output_path: "",
      output_file: "",
      min_contig_len: 2500,
      min_contig_cov: 1,
      disable_dangling: false,
    },
  });
  return (
    <Wrapper>
      <MetagenomicBinningParametersCard
        form={form as never}
        startWith={startWith}
        metaspadesDisabled={metaspadesDisabled}
        showAdvanced={showAdvanced}
        onShowAdvancedChange={onShowAdvancedChange}
      />
    </Wrapper>
  );
}

describe("MetagenomicBinningParametersCard", () => {
  it("renders Assembly Strategy radio group when startWith is reads", () => {
    render(<ParametersWrapper startWith="reads" />);

    expect(screen.getByRole("radio", { name: /metaspades/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /megahit/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /^auto$/i })).toBeInTheDocument();
  });

  it("hides Assembly Strategy radio group when startWith is contigs", () => {
    render(<ParametersWrapper startWith="contigs" />);

    expect(screen.queryByText("Assembly Strategy")).not.toBeInTheDocument();
  });

  it("MetaSPAdes radio is disabled when metaspadesDisabled is true", () => {
    render(<ParametersWrapper startWith="reads" metaspadesDisabled={true} />);

    expect(screen.getByRole("radio", { name: /metaspades/i })).toHaveAttribute("aria-disabled", "true");
  });

  it("MetaSPAdes radio is enabled when metaspadesDisabled is false", () => {
    render(<ParametersWrapper startWith="reads" metaspadesDisabled={false} />);

    expect(screen.getByRole("radio", { name: /metaspades/i })).not.toHaveAttribute("aria-disabled", "true");
  });

  it("Advanced Parameters section is hidden by default", () => {
    render(<ParametersWrapper showAdvanced={false} />);

    const el = screen.queryByText("Minimum Contig Length");
    expect(el).not.toBeVisible();
  });

  it("Advanced Parameters section is visible when showAdvanced is true", () => {
    render(<ParametersWrapper showAdvanced={true} />);

    expect(screen.getByText("Minimum Contig Length")).toBeInTheDocument();
    expect(screen.getByText("Minimum Contig Coverage")).toBeInTheDocument();
  });

  it("calls onShowAdvancedChange(true) when Advanced Parameters trigger is clicked", async () => {
    const user = userEvent.setup();
    const onShowAdvancedChange = vi.fn();
    render(
      <ParametersWrapper
        showAdvanced={false}
        onShowAdvancedChange={onShowAdvancedChange}
      />,
    );

    await user.click(screen.getByText("Advanced Parameters"));

    expect(onShowAdvancedChange).toHaveBeenCalledWith(true, expect.anything());
  });
});
