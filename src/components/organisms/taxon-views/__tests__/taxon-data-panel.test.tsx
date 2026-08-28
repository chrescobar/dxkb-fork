import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/components/views/resource-workspace", () => ({
  ResourceWorkspace: ({
    hasSidePanel,
    actionBar,
    sidePanel,
    children,
  }: {
    hasSidePanel: boolean;
    actionBar: ReactNode;
    sidePanel: ReactNode;
    children: ReactNode;
  }) => (
    <div data-testid="shell" data-has-side-panel={String(hasSidePanel)}>
      {actionBar}
      {sidePanel}
      {children}
    </div>
  ),
}));

vi.mock("@/components/search/search-action-bar", () => ({
  SearchActionBar: ({
    selectedCount,
    searchType,
    guideUrl,
    onAction,
  }: {
    selectedCount: number;
    searchType: string;
    guideUrl?: string;
    onAction?: (actionId: string) => void;
  }) => (
    <div
      data-testid="action-bar"
      data-count={selectedCount}
      data-resource={searchType}
      data-guide={guideUrl}
    >
      <button type="button" onClick={() => onAction?.("feature")}>
        feature-action
      </button>
    </div>
  ),
}));

vi.mock("@/components/genome/genome-detail-panel", () => ({
  GenomeDetailPanel: ({
    genomeId,
    selectedIds,
    isAllPagesSelected,
    totalItems,
  }: {
    genomeId: string | null;
    selectedIds: string[];
    isAllPagesSelected: boolean;
    totalItems: number;
  }) => (
    <div
      data-testid="detail-panel"
      data-id={genomeId ?? ""}
      data-selected={selectedIds.join(",")}
      data-all-pages={String(isAllPagesSelected)}
      data-total={totalItems}
    />
  ),
}));

vi.mock("@/components/services/list-data", () => ({
  ListData: ({
    resource,
    q,
    keywordValue,
    onKeywordChange,
    onFilterChange,
    onSelectionChange,
    onSelectedRowChange,
    onAllPagesSelectionChange,
    onTotalItemsChange,
  }: {
    resource: string;
    q: string;
    keywordValue?: string;
    onKeywordChange?: (value: string) => void;
    onFilterChange?: (value: string) => void;
    onSelectionChange: (ids: string[]) => void;
    onSelectedRowChange?: (row: Record<string, unknown> | null) => void;
    onAllPagesSelectionChange: (selected: boolean) => void;
    onTotalItemsChange: (total: number) => void;
  }) => (
    <div
      data-testid="list-data"
      data-resource={resource}
      data-q={q}
      data-keyword={keywordValue}
    >
      <button
        type="button"
        onClick={() => {
          onSelectionChange(["a", "b"]);
        }}
      >
        select-two
      </button>
      <button
        type="button"
        onClick={() => {
          onSelectionChange([]);
        }}
      >
        clear
      </button>
      <button
        type="button"
        onClick={() => {
          onSelectionChange([]);
          onSelectionChange([]);
        }}
      >
        clear-twice
      </button>
      <button
        type="button"
        onClick={() => {
          onSelectedRowChange?.({
            feature_id: "canonical-feature",
            patric_id: "fig|83332.12.peg.1",
            genome_id: "83332.12",
          });
          onSelectionChange(["canonical-feature"]);
        }}
      >
        select-feature
      </button>
      <button
        type="button"
        onClick={() => {
          onSelectionChange(["c"]);
        }}
      >
        select-new
      </button>
      <button
        type="button"
        onClick={() => {
          onTotalItemsChange(42);
          onAllPagesSelectionChange(true);
        }}
      >
        select-all-pages
      </button>
      <button
        type="button"
        onClick={() => {
          onKeywordChange?.("updated");
        }}
      >
        keyword
      </button>
      <button
        type="button"
        onClick={() => {
          onFilterChange?.("and(eq(a,b))");
        }}
      >
        filter
      </button>
    </div>
  ),
}));

import { TaxonDataPanel } from "../taxon-data-panel";

describe("TaxonDataPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("forwards its data contract and tracks the latest selected detail row", () => {
    const onKeywordChange = vi.fn();
    const onFilterChange = vi.fn();
    render(
      <TaxonDataPanel
        resource="genome"
        q="eq(taxon_lineage_ids,2)"
        guideUrl="https://example.test/guide"
        keywordValue="initial"
        onKeywordChange={onKeywordChange}
        onFilterChange={onFilterChange}
      />,
    );

    expect(screen.getByTestId("list-data")).toHaveAttribute(
      "data-resource",
      "genome",
    );
    expect(screen.getByTestId("list-data")).toHaveAttribute(
      "data-q",
      "eq(taxon_lineage_ids,2)",
    );
    expect(screen.getByTestId("list-data")).toHaveAttribute(
      "data-keyword",
      "initial",
    );
    expect(screen.getByTestId("action-bar")).toHaveAttribute(
      "data-guide",
      "https://example.test/guide",
    );

    fireEvent.click(screen.getByRole("button", { name: "select-two" }));
    expect(screen.getByTestId("shell")).toHaveAttribute(
      "data-has-side-panel",
      "true",
    );
    expect(screen.getByTestId("detail-panel")).toHaveAttribute("data-id", "b");
    expect(screen.getByTestId("detail-panel")).toHaveAttribute(
      "data-selected",
      "a,b",
    );
    expect(screen.getByTestId("action-bar")).toHaveAttribute("data-count", "2");

    fireEvent.click(screen.getByRole("button", { name: "keyword" }));
    fireEvent.click(screen.getByRole("button", { name: "filter" }));
    expect(onKeywordChange).toHaveBeenCalledWith("updated");
    expect(onFilterChange).toHaveBeenCalledWith("and(eq(a,b))");
  });

  it("navigates the Feature action to the selected feature member", () => {
    render(
      <TaxonDataPanel
        resource="genome_feature"
        q="eq(genome_id,83332.12)"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "select-feature" }));
    fireEvent.click(screen.getByRole("button", { name: "feature-action" }));

    expect(push).toHaveBeenCalledWith("/feature/canonical-feature");
  });

  it("uses the total count for all-pages selection", () => {
    render(<TaxonDataPanel resource="genome" q="eq(taxon_lineage_ids,2)" />);
    fireEvent.click(screen.getByRole("button", { name: "select-two" }));
    fireEvent.click(screen.getByRole("button", { name: "select-all-pages" }));

    expect(screen.getByTestId("action-bar")).toHaveAttribute(
      "data-count",
      "42",
    );
    expect(screen.getByTestId("detail-panel")).toHaveAttribute(
      "data-all-pages",
      "true",
    );
    expect(screen.getByTestId("detail-panel")).toHaveAttribute(
      "data-total",
      "42",
    );
  });

  it("delays closing and cancels that close when another row is selected", () => {
    render(<TaxonDataPanel resource="genome" q="eq(taxon_lineage_ids,2)" />);
    fireEvent.click(screen.getByRole("button", { name: "select-two" }));
    fireEvent.click(screen.getByRole("button", { name: "clear" }));

    act(() => {
      vi.advanceTimersByTime(119);
    });
    expect(screen.getByTestId("shell")).toHaveAttribute(
      "data-has-side-panel",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "select-new" }));
    act(() => {
      vi.advanceTimersByTime(120);
    });
    expect(screen.getByTestId("shell")).toHaveAttribute(
      "data-has-side-panel",
      "true",
    );
    expect(screen.getByTestId("detail-panel")).toHaveAttribute("data-id", "c");

    fireEvent.click(screen.getByRole("button", { name: "clear" }));
    act(() => {
      vi.advanceTimersByTime(120);
    });
    expect(screen.getByTestId("shell")).toHaveAttribute(
      "data-has-side-panel",
      "false",
    );
  });

  it("cancels repeated empty notifications when a new row is selected", () => {
    render(<TaxonDataPanel resource="genome" q="eq(taxon_lineage_ids,2)" />);
    fireEvent.click(screen.getByRole("button", { name: "select-two" }));
    fireEvent.click(screen.getByRole("button", { name: "clear-twice" }));
    fireEvent.click(screen.getByRole("button", { name: "select-new" }));

    act(() => {
      vi.advanceTimersByTime(120);
    });

    expect(screen.getByTestId("shell")).toHaveAttribute(
      "data-has-side-panel",
      "true",
    );
    expect(screen.getByTestId("detail-panel")).toHaveAttribute("data-id", "c");
  });
});
