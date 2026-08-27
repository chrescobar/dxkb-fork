/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
import type { ReactNode } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DataRepository } from "@/lib/data-api";
import { genomeCollectionProfile } from "@/lib/genome-view/profile";
import type { CollectionState } from "@/lib/views/collection-state";
import { ResourceCollection } from "../resource-collection";

const { push, downloadResourceExport, useResourceCollection } = vi.hoisted(
  () => ({
    push: vi.fn(),
    downloadResourceExport: vi.fn(),
    useResourceCollection: vi.fn(),
  }),
);
let dataTableProps: Record<string, unknown>;
let actionBarProps: Record<string, unknown>;

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("../resource-export", () => ({ downloadResourceExport }));
vi.mock("@/hooks/views/use-resource-collection", () => ({
  useResourceCollection: (options: unknown) => useResourceCollection(options),
}));
vi.mock("../resource-filter-bar", () => ({
  ResourceFilterBar: (props: Record<string, unknown>) => (
    <div
      data-testid="filter-bar"
      data-definitions={JSON.stringify(props.definitions)}
    />
  ),
}));
vi.mock("@/components/search/search-action-bar", () => ({
  SearchActionBar: (props: Record<string, unknown>) => {
    actionBarProps = props;
    return (
      <button
        onClick={() =>
          (props.onAction as ((action: string) => void) | undefined)?.("genome")
        }
      >
        Genome action
      </button>
    );
  },
}));
vi.mock("@/components/detail-panel/info-panel", () => ({
  InfoPanel: ({ selectedRow }: { selectedRow: Record<string, unknown> }) => (
    <div data-testid="detail">{String(selectedRow.genome_name)}</div>
  ),
}));
vi.mock("../resource-workspace", () => ({
  ResourceWorkspace: ({
    children,
    actionBar,
    sidePanel,
  }: {
    children: ReactNode;
    actionBar: ReactNode;
    sidePanel: ReactNode;
  }) => (
    <div>
      {actionBar}
      {children}
      {sidePanel}
    </div>
  ),
}));
vi.mock("@/components/shared/data-table", () => ({
  DataTable: (props: Record<string, unknown>) => {
    dataTableProps = props;
    const columns = props.columns as {
      id: string;
      href?: (row: Record<string, unknown>) => string | undefined;
    }[];
    const row = (props.data as Record<string, unknown>[])[0];
    const linkColumn = columns.find((column) => column.href);
    return (
      <div data-testid="data-table">
        {linkColumn?.href ? (
          <a href={linkColumn.href(row)}>{String(row.genome_name)}</a>
        ) : null}
        <button
          onClick={() =>
            void (
              props.onDownloadAll as (
                format: "csv",
                fields: null,
              ) => Promise<void>
            )("csv", null)
          }
        >
          Export all
        </button>
      </div>
    );
  },
}));

const state: CollectionState = {
  keyword: "coli",
  filters: { genome_status: ["Complete"] },
  page: 3,
  sort: "genome_length:desc",
};
const row = {
  genome_id: "83332.12",
  genome_name: "E. coli fixture",
  genome_length: 1234,
};

function collectionResult() {
  return {
    activeId: "83332.12",
    detail: row,
    detailError: null,
    facets: { genome_status: [{ value: "Complete", count: 1 }] },
    isAllPagesSelected: false,
    isDetailLoading: false,
    isInitialLoading: false,
    isRefreshing: false,
    error: null,
    refetch: vi.fn(),
    rows: [row],
    selection: { "83332.12": true },
    selectedIds: ["83332.12"],
    sorting: [{ id: "genome_length", desc: true }],
    total: 1,
    setIsAllPagesSelected: vi.fn(),
    setSelection: vi.fn(),
    setPageIndex: vi.fn(),
    setSorting: vi.fn(),
  };
}

function repository(
  exportResult: Promise<unknown> = Promise.resolve({ rows: [row] }),
) {
  return {
    export: vi.fn(() => exportResult),
    selected: vi.fn(),
  } as unknown as DataRepository;
}

beforeEach(() => {
  useResourceCollection.mockReturnValue(collectionResult());
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:test"),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("ResourceCollection Genome integration contracts", () => {
  it("keeps global and taxon-scoped views on the same profile and interaction surface", () => {
    const global = render(
      <ResourceCollection
        profile={genomeCollectionProfile}
        repository={repository()}
        state={state}
        onStateChange={vi.fn()}
        showHeader={false}
      />,
    );
    const globalHookOptions = useResourceCollection.mock.calls.at(-1)?.[0];
    const globalTable = dataTableProps;
    const globalActions = actionBarProps;
    const globalFacets = screen.getByTestId("filter-bar").dataset.definitions;
    expect(screen.getByTestId("detail")).toHaveTextContent("E. coli fixture");
    global.unmount();

    render(
      <ResourceCollection
        profile={genomeCollectionProfile}
        repository={repository()}
        state={state}
        onStateChange={vi.fn()}
        baseRql="eq(taxon_lineage_ids,561)"
        showHeader={false}
      />,
    );
    const scopedHookOptions = useResourceCollection.mock.calls.at(-1)?.[0];

    expect(scopedHookOptions).toMatchObject({
      resource: globalHookOptions.resource,
      idField: globalHookOptions.idField,
      fields: globalHookOptions.fields,
      detailFields: globalHookOptions.detailFields,
      facetFields: globalHookOptions.facetFields,
      structuralRql:
        "and(eq(taxon_lineage_ids,561),eq(genome_status,Complete))",
    });
    expect(dataTableProps).toMatchObject({
      columns: globalTable.columns,
      pageIndex: globalTable.pageIndex,
      pageSize: globalTable.pageSize,
      sorting: globalTable.sorting,
      onPageChange: globalTable.onPageChange,
      onSortingChange: globalTable.onSortingChange,
    });
    expect(actionBarProps).toMatchObject({
      searchType: globalActions.searchType,
      selectedCount: globalActions.selectedCount,
    });
    expect(screen.getByTestId("filter-bar").dataset.definitions).toBe(
      globalFacets,
    );
    expect(screen.getByTestId("detail")).toHaveTextContent("E. coli fixture");
  });

  it("projects row links to members and navigates the Genome action", async () => {
    const user = userEvent.setup();
    render(
      <ResourceCollection
        profile={genomeCollectionProfile}
        repository={repository()}
        state={state}
        onStateChange={vi.fn()}
        showHeader={false}
      />,
    );

    expect(
      screen.getByRole("link", { name: "E. coli fixture" }),
    ).toHaveAttribute("href", "/genome/83332.12");
    await user.click(screen.getByRole("button", { name: "Genome action" }));
    expect(push).toHaveBeenCalledWith("/genome/83332.12");
  });

  it("requests up to 10,000 matching rows using the active scope, sort, and columns", async () => {
    const data = repository();
    render(
      <ResourceCollection
        profile={genomeCollectionProfile}
        repository={data}
        state={state}
        onStateChange={vi.fn()}
        baseRql="eq(taxon_lineage_ids,561)"
        showHeader={false}
      />,
    );

    await act(async () => {
      await (
        dataTableProps.onDownloadAll as (
          format: "csv",
          fields: null,
        ) => Promise<void>
      )("csv", null);
    });

    expect(data.export).toHaveBeenCalledWith("genome", {
      rql: "and(eq(taxon_lineage_ids,561),eq(genome_status,Complete))",
      keyword: "coli",
      fields: genomeCollectionProfile.columns.map((column) => column.id),
      limit: 10_000,
      sort: { field: "genome_length", direction: "desc" },
    });
    expect(downloadResourceExport).toHaveBeenCalledWith(
      "genome",
      [row],
      genomeCollectionProfile.columns,
      genomeCollectionProfile.columns.map((column) => column.id),
      "csv",
    );
  });

  it("makes export failures visible while preserving the original message", async () => {
    const error = new Error("Genome export service unavailable");
    const data = repository(Promise.reject(error));
    render(
      <ResourceCollection
        profile={genomeCollectionProfile}
        repository={data}
        state={state}
        onStateChange={vi.fn()}
        showHeader={false}
      />,
    );

    await act(async () => {
      await (
        dataTableProps.onDownloadAll as (
          format: "csv",
          fields: null,
        ) => Promise<void>
      )("csv", null);
    });
    await waitFor(() =>
      expect(
        screen.getByText("Genome export service unavailable"),
      ).toBeVisible(),
    );
    expect(screen.getByText("Could not export genomes")).toBeVisible();
  });
});
