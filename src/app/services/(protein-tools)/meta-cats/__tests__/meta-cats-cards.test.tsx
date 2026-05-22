import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, useStore } from "@tanstack/react-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { MetaCatsParametersCard } from "@/app/services/(protein-tools)/meta-cats/meta-cats-parameters-card";
import { MetaCatsInputCard } from "@/app/services/(protein-tools)/meta-cats/meta-cats-input-card";
import { MetaCatsAlignmentCard } from "@/app/services/(protein-tools)/meta-cats/meta-cats-alignment-card";
import type { UseMetaCatsAutoGroupingReturn } from "@/hooks/services/use-meta-cats-auto-grouping";
import type { UseMetaCatsYearRangesReturn } from "@/hooks/services/use-meta-cats-year-ranges";

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

function makeAutoGrouping(
  overrides: Partial<UseMetaCatsAutoGroupingReturn> = {},
): UseMetaCatsAutoGroupingReturn {
  return {
    selectedFeatureGroupObject: null,
    setSelectedFeatureGroupObject: vi.fn(),
    isLoadingAutoGroup: false,
    selectedGridRows: new Set(),
    setSelectedGridRows: vi.fn(),
    groupNames: [],
    selectedGroupName: "",
    setSelectedGroupName: vi.fn(),
    addSelectedFeatureGroup: vi.fn(),
    deleteSelectedRows: vi.fn(),
    changeSelectedRowsGroup: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };
}

function makeYearRanges(
  overrides: Partial<UseMetaCatsYearRangesReturn> = {},
): UseMetaCatsYearRangesReturn {
  return {
    yearRangesInput: "",
    yearRangesValidation: null,
    handleYearRangesChange: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };
}

// ── MetaCatsParametersCard ────────────────────────────────────────────────────

function MetaCatsParametersWrapper() {
  const form = useForm({
    defaultValues: {
      p_value: 0.05,
      output_path: "",
      output_file: "",
    },
  });
  return (
    <Wrapper>
      <MetaCatsParametersCard form={form as never} />
    </Wrapper>
  );
}

describe("MetaCatsParametersCard", () => {
  it("renders P-Value input field", () => {
    render(<MetaCatsParametersWrapper />);

    expect(screen.getByText(/p-value/i)).toBeInTheDocument();
  });

  it("renders output folder and name fields", () => {
    render(<MetaCatsParametersWrapper />);

    expect(
      screen.getByPlaceholderText(/select output name/i),
    ).toBeInTheDocument();
  });
});

// ── MetaCatsInputCard ─────────────────────────────────────────────────────────

function MetaCatsInputWrapper({
  initialInputType = "auto" as const,
  initialMetadataGroup = "host_name",
  autoGrouping = makeAutoGrouping(),
  yearRanges = makeYearRanges(),
}: {
  initialInputType?: "auto" | "groups" | "files";
  initialMetadataGroup?: string;
  autoGrouping?: UseMetaCatsAutoGroupingReturn;
  yearRanges?: UseMetaCatsYearRangesReturn;
}) {
  const form = useForm({
    defaultValues: {
      input_type: initialInputType,
      metadata_group: initialMetadataGroup,
      year_ranges: "",
      auto_groups: [] as unknown[],
      auto_alphabet: "aa" as const,
      groups: [] as string[],
      group_alphabet: "aa" as const,
      alignment_file: "",
      alignment_type: "",
      group_file: "",
    },
  });
  return (
    <Wrapper>
      <MetaCatsInputCard
        form={form as never}
        yearRanges={yearRanges}
        autoGrouping={autoGrouping}
        selectedFeatureGroupObject={null}
        setSelectedFeatureGroupObject={vi.fn()}
        onSelectAllRows={vi.fn()}
        onRowSelect={vi.fn()}
        onAddFeatureGroup={vi.fn()}
        onRemoveFeatureGroup={vi.fn()}
      />
    </Wrapper>
  );
}

describe("MetaCatsInputCard", () => {
  it("renders all three input type radio options", () => {
    render(<MetaCatsInputWrapper />);

    expect(screen.getByRole("radio", { name: /auto grouping/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /feature groups/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /alignment file/i })).toBeInTheDocument();
  });

  it("shows auto-grouping section when inputType is auto", () => {
    render(<MetaCatsInputWrapper initialInputType="auto" />);

    expect(screen.getAllByText(/select feature group/i)[0]).toBeInTheDocument();
    expect(
      screen.getByText(/no features added/i),
    ).toBeInTheDocument();
  });

  it("shows Year Ranges input when metadata_group is collection_year", async () => {
    const user = userEvent.setup();
    render(
      <MetaCatsInputWrapper
        initialInputType="auto"
        initialMetadataGroup="host_name"
      />,
    );

    // First combobox is the metadata_group select
    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    await user.click(await screen.findByText(/collection year/i));

    expect(screen.getByPlaceholderText(/1998,1999-2005/i)).toBeInTheDocument();
  });

  it("hides Year Ranges input when metadata_group is not collection_year", () => {
    render(
      <MetaCatsInputWrapper
        initialInputType="auto"
        initialMetadataGroup="host_name"
      />,
    );

    expect(screen.queryByPlaceholderText(/1998,1999-2005/i)).not.toBeInTheDocument();
  });

  it("shows feature groups section when inputType is groups", async () => {
    const user = userEvent.setup();
    render(<MetaCatsInputWrapper initialInputType="auto" />);

    await user.click(screen.getByRole("radio", { name: /feature groups/i }));

    expect(
      screen.getByText(/selected feature groups/i),
    ).toBeInTheDocument();
  });

  it("shows alignment file section when inputType is files", async () => {
    const user = userEvent.setup();
    render(<MetaCatsInputWrapper initialInputType="auto" />);

    await user.click(screen.getByRole("radio", { name: /alignment file/i }));

    expect(screen.getAllByText(/^alignment file$/i)[0]).toBeInTheDocument();
  });

  it("calls autoGrouping.changeSelectedRowsGroup when Change group button is clicked", async () => {
    const user = userEvent.setup();
    const changeSelectedRowsGroup = vi.fn();
    render(
      <MetaCatsInputWrapper
        initialInputType="auto"
        autoGrouping={makeAutoGrouping({
          selectedGridRows: new Set(["r1"]),
          selectedGroupName: "GroupA",
          changeSelectedRowsGroup,
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /change group/i }));

    expect(changeSelectedRowsGroup).toHaveBeenCalledTimes(1);
  });
});

// ── MetaCatsAlignmentCard ─────────────────────────────────────────────────────

function MetaCatsAlignmentWrapper() {
  const form = useForm({
    defaultValues: {
      alignment_file: "",
      alignment_type: "",
      group_file: "",
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const alignmentFileValue = useStore(form.store, (s: any) => (s.values.alignment_file as string) ?? "");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupFileValue = useStore(form.store, (s: any) => (s.values.group_file as string) ?? "");
  return (
    <Wrapper>
      <MetaCatsAlignmentCard
        form={form as never}
        alignmentFileValue={alignmentFileValue}
        groupFileValue={groupFileValue}
        onAlignmentFileChange={vi.fn()}
      />
    </Wrapper>
  );
}

describe("MetaCatsAlignmentCard", () => {
  it("renders Alignment File selector and Group File selector", () => {
    render(<MetaCatsAlignmentWrapper />);

    expect(screen.getByText(/^alignment file$/i)).toBeInTheDocument();
    expect(screen.getByText(/^group file$/i)).toBeInTheDocument();
  });

  it("clicking alignment file selector updates the alignment_file field", async () => {
    const user = userEvent.setup();
    render(<MetaCatsAlignmentWrapper />);

    const selectors = screen.getAllByTestId("workspace-selector");
    await user.click(selectors[0]);

    expect(selectors[0]).toHaveTextContent("/user/test-path");
  });

  it("clicking group file selector updates the group_file field", async () => {
    const user = userEvent.setup();
    render(<MetaCatsAlignmentWrapper />);

    const selectors = screen.getAllByTestId("workspace-selector");
    await user.click(selectors[1]);

    expect(selectors[1]).toHaveTextContent("/user/test-path");
  });
});
