import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { GenomeAssemblyParametersCard } from "@/app/services/(genomics)/genome-assembly/genome-assembly-parameters-card";

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

function ParametersCardWrapper({
  showGenomeSizeField = false,
  genomeSizeUnit = "M" as const,
  expectedGenomeSize = 5,
  showAdvanced = false,
  onExpectedGenomeSizeChange = vi.fn(),
  onGenomeSizeUnitChange = vi.fn(),
  onShowAdvancedChange = vi.fn(),
}: {
  showGenomeSizeField?: boolean;
  genomeSizeUnit?: "M" | "K";
  expectedGenomeSize?: number;
  showAdvanced?: boolean;
  onExpectedGenomeSizeChange?: (value: number, unit: "M" | "K") => void;
  onGenomeSizeUnitChange?: (unit: "M" | "K") => void;
  onShowAdvancedChange?: (open: boolean) => void;
}) {
  const form = useForm({
    defaultValues: {
      recipe: "auto",
      output_path: "",
      output_file: "",
      genome_size: 5000000,
      normalize: false,
      trim: false,
      filtlong: false,
    },
  });
  return (
    <Wrapper>
      <GenomeAssemblyParametersCard
        form={form as never}
        showGenomeSizeField={showGenomeSizeField}
        genomeSizeUnit={genomeSizeUnit}
        expectedGenomeSize={expectedGenomeSize}
        showAdvanced={showAdvanced}
        onExpectedGenomeSizeChange={onExpectedGenomeSizeChange}
        onGenomeSizeUnitChange={onGenomeSizeUnitChange}
        onShowAdvancedChange={onShowAdvancedChange}
      />
    </Wrapper>
  );
}

describe("GenomeAssemblyParametersCard", () => {
  it("renders Assembly Strategy select with all recipe options", async () => {
    const user = userEvent.setup();
    render(<ParametersCardWrapper />);

    expect(screen.getByText("Assembly Strategy")).toBeInTheDocument();

    const trigger = screen.getByRole("combobox", { name: /assembly strategy/i });
    await user.click(trigger);

    expect(await screen.findByText("Unicycler")).toBeInTheDocument();
  });

  it("renders Estimated Genome Size field when showGenomeSizeField is true", () => {
    render(<ParametersCardWrapper showGenomeSizeField={true} />);

    expect(screen.getByText("Estimated Genome Size")).toBeInTheDocument();
  });

  it("hides Estimated Genome Size field when showGenomeSizeField is false", () => {
    render(<ParametersCardWrapper showGenomeSizeField={false} />);

    expect(
      screen.queryByText("Estimated Genome Size"),
    ).not.toBeInTheDocument();
  });

  it("calls onExpectedGenomeSizeChange when size input changes", async () => {
    const user = userEvent.setup();
    const onExpectedGenomeSizeChange = vi.fn();
    render(
      <ParametersCardWrapper
        showGenomeSizeField={true}
        onExpectedGenomeSizeChange={onExpectedGenomeSizeChange}
      />,
    );

    const sizeInput = screen.getByRole("spinbutton");
    await user.clear(sizeInput);
    await user.type(sizeInput, "10");

    expect(onExpectedGenomeSizeChange).toHaveBeenCalled();
  });

  it("calls onGenomeSizeUnitChange when the unit select changes", async () => {
    const user = userEvent.setup();
    const onGenomeSizeUnitChange = vi.fn();
    render(
      <ParametersCardWrapper
        showGenomeSizeField={true}
        genomeSizeUnit="M"
        onGenomeSizeUnitChange={onGenomeSizeUnitChange}
      />,
    );

    const unitTrigger = screen.getByRole("combobox", { name: /unit/i });
    await user.click(unitTrigger);
    await user.click(await screen.findByText("K"));

    expect(onGenomeSizeUnitChange).toHaveBeenCalledWith("K");
  });

  it("Advanced Options section is closed by default", () => {
    render(<ParametersCardWrapper showAdvanced={false} />);

    const el = screen.queryByText("Normalize Illumina Reads");
    expect(el).not.toBeVisible();
  });

  it("Advanced Options section is visible when showAdvanced is true", () => {
    render(<ParametersCardWrapper showAdvanced={true} />);

    expect(screen.getByText("Normalize Illumina Reads")).toBeInTheDocument();
    expect(screen.getByText("Trim Short Reads")).toBeInTheDocument();
    expect(screen.getByText("Filter Long Reads")).toBeInTheDocument();
  });

  it("calls onShowAdvancedChange when the trigger is clicked", async () => {
    const user = userEvent.setup();
    const onShowAdvancedChange = vi.fn();
    render(
      <ParametersCardWrapper
        showAdvanced={false}
        onShowAdvancedChange={onShowAdvancedChange}
      />,
    );

    await user.click(screen.getByText("Advanced Options"));

    expect(onShowAdvancedChange).toHaveBeenCalledWith(true, expect.anything());
  });
});
