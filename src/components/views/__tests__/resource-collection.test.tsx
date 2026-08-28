import type { ReactNode } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DataRepository } from "@/lib/data-api";
import { featureCollectionProfile } from "@/lib/feature-view/profile";
import { genomeCollectionProfile } from "@/lib/genome-view/profile";
import type { CollectionState } from "@/lib/views/collection-state";
import type { useResourceCollection as useResourceCollectionHook } from "@/hooks/views/use-resource-collection";
import { ResourceCollection } from "../resource-collection";

const { push, downloadResourceExport, useResourceCollection } = vi.hoisted(
  () => ({
    push: vi.fn(),
    downloadResourceExport: vi.fn(),
    useResourceCollection: vi.fn<typeof useResourceCollectionHook>(),
  }),
);
let dataTableProps: Record<string, unknown>;
let actionBarProps: Record<string, unknown>;

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("../resource-export", () => ({ downloadResourceExport }));
vi.mock("@/hooks/views/use-resource-collection", () => ({
  useResourceCollection,
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
      <div>
        <button
          onClick={() =>
            (props.onAction as ((action: string) => void) | undefined)?.("genome")
          }
        >
          Genome action
        </button>
        <button
          onClick={() =>
            (props.onAction as ((action: string) => void) | undefined)?.("feature")
          }
        >
          Feature action
        </button>
      </div>
    );
  },
}));
vi.mock("@/components/detail-panel/info-panel", () => ({
  InfoPanel: ({ selectedRow }: { selectedRow: Record<string, unknown> | null }) => (
    <div data-testid="detail">
      {selectedRow ? String(selectedRow.genome_name) : null}
    </div>
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
    const rows = props.data as Record<string, unknown>[];
    const linkColumn = columns.find((column) => column.href);
    return (
      <div data-testid="data-table">
        {linkColumn?.href && rows.length > 0 ? (
          <a href={linkColumn.href(rows[0])}>{String(rows[0].genome_name)}</a>
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
    selection: { "83332.12": true as const },
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
    exportAll: vi.fn(() => exportResult),
    selected: vi.fn(() => exportResult),
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
    if (!globalHookOptions) throw new Error("Collection hook was not called");
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

  it("projects row links and opens the Genome action in a new tab", async () => {
    const user = userEvent.setup();
    const open = vi.fn();
    vi.stubGlobal("open", open);
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
    expect(open).toHaveBeenCalledWith(
      "/genome/83332.12",
      "_blank",
      "noopener,noreferrer",
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("opens the selected feature member in a new tab", async () => {
    const user = userEvent.setup();
    const open = vi.fn();
    vi.stubGlobal("open", open);
    useResourceCollection.mockReturnValueOnce({
      ...collectionResult(),
      activeId: "canonical-feature",
      detail: {
        feature_id: "canonical-feature",
        patric_id: "fig|83332.12.peg.1",
        genome_id: "83332.12",
      },
      rows: [
        {
          feature_id: "canonical-feature",
          patric_id: "fig|83332.12.peg.1",
          genome_id: "83332.12",
        },
      ],
      selection: { "canonical-feature": true },
      selectedIds: ["canonical-feature"],
    });

    render(
      <ResourceCollection
        profile={featureCollectionProfile}
        repository={repository()}
        state={{ ...state, sort: "patric_id:asc" }}
        onStateChange={vi.fn()}
        showHeader={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Feature action" }));
    expect(open).toHaveBeenCalledWith(
      "/feature/canonical-feature",
      "_blank",
      "noopener,noreferrer",
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("requests all matching rows using the active scope, sort, and columns", async () => {
    const data = repository();
    const exportAll = vi.spyOn(data, "exportAll");
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

    expect(exportAll).toHaveBeenCalledWith("genome", {
      rql: "and(eq(taxon_lineage_ids,561),eq(genome_status,Complete))",
      keyword: "coli",
      fields: genomeCollectionProfile.columns.map((column) => column.id),
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

  it("exports selected displayed columns without requiring the ID in the output", async () => {
    const data = repository();
    const selected = vi.spyOn(data, "selected");
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
        dataTableProps.onDownloadSelected as (
          format: "csv",
          ids: string[],
          fields: string[],
        ) => Promise<void>
      )("csv", ["83332.12"], ["genome_name"]);
    });

    expect(selected).toHaveBeenCalledWith("genome", {
      ids: ["83332.12"],
      fields: ["genome_name"],
    });
    expect(downloadResourceExport).toHaveBeenCalledWith(
      "genome",
      [row],
      genomeCollectionProfile.columns,
      ["genome_name"],
      "csv",
    );
  });

  it("does not export all using a stale total while results refresh", async () => {
    const data = repository();
    const exportAll = vi.spyOn(data, "exportAll");
    useResourceCollection.mockReturnValueOnce({
      ...collectionResult(),
      isRefreshing: true,
    });
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

    expect(exportAll).not.toHaveBeenCalled();
    expect(screen.getByText(/finish loading before exporting/)).toBeVisible();
  });

  it("rejects all-matching exports over 10,000 rows before requesting data", async () => {
    const data = repository();
    const exportAll = vi.spyOn(data, "exportAll");
    useResourceCollection.mockReturnValueOnce({
      ...collectionResult(),
      total: 10_001,
    });
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

    expect(exportAll).not.toHaveBeenCalled();
    expect(
      screen.getByText(/This export matches 10,001 rows/),
    ).toBeVisible();
  });

  it("surfaces full-detail errors instead of showing a partial row", () => {
    useResourceCollection.mockReturnValueOnce({
      ...collectionResult(),
      detailError: new Error("Genome detail service unavailable"),
    });
    render(
      <ResourceCollection
        profile={genomeCollectionProfile}
        repository={repository()}
        state={state}
        onStateChange={vi.fn()}
        showHeader={false}
      />,
    );

    expect(screen.getByText("Could not load record details")).toBeVisible();
    expect(screen.getByText("Genome detail service unavailable")).toBeVisible();
    expect(screen.queryByTestId("detail")).not.toBeInTheDocument();
  });

  it("keeps the data table mounted when no rows are available", () => {
    useResourceCollection.mockReturnValueOnce({
      ...collectionResult(),
      activeId: null,
      detail: null,
      rows: [],
      selection: {},
      selectedIds: [],
      total: 0,
    });

    render(
      <ResourceCollection
        profile={genomeCollectionProfile}
        repository={repository()}
        state={{ ...state, keyword: "", filters: {}, page: 1 }}
        onStateChange={vi.fn()}
        showHeader={false}
      />,
    );

    expect(screen.getByTestId("data-table")).toBeInTheDocument();
    expect(dataTableProps).toMatchObject({ data: [], totalItems: 0 });
  });

  it("passes the effective RQL to delegated exports", async () => {
    const onExport = vi.fn();
    render(
      <ResourceCollection
        profile={genomeCollectionProfile}
        repository={repository()}
        state={{ ...state, rql: "eq(genome_id,83332.12)" }}
        onStateChange={vi.fn()}
        baseRql="eq(taxon_lineage_ids,561)"
        showHeader={false}
        onExport={onExport}
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

    expect(onExport).toHaveBeenCalledWith({
      format: "csv",
      selectedIds: undefined,
      fields: null,
      rql: "and(eq(taxon_lineage_ids,561),eq(genome_id,83332.12))",
    });
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
