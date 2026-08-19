import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { InteractionsGraph } from "../interactions-graph";
import { useInteractions } from "@/lib/interactions/use-interactions";
import type { PpiRecord } from "@/lib/interactions/types";

// InteractionsGraph only reaches SigmaCanvas (WebGL, untestable in jsdom —
// see docs/architecture.md / testing.md canvas exclusion) once useInteractions
// resolves with rows. Mocking it pending keeps the component on its "Loading
// interactions…" branch, which is enough to observe what query it built.
vi.mock("@/lib/interactions/use-interactions", () => ({
  useInteractions: vi.fn(() => ({ data: undefined, isPending: true, isError: false, error: null })),
}));

vi.mock("../sigma/sigma-canvas", () => ({
  SigmaCanvas: () => <div data-testid="sigma-canvas" />,
}));

const graphRows: PpiRecord[] = [
  {
    id: "edge-1",
    interactor_a: "node-a",
    interactor_b: "node-b",
    gene_a: "geneA",
    gene_b: "geneB",
  },
];

class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal("ResizeObserver", ResizeObserverStub);
vi.stubGlobal("scrollTo", vi.fn());
Element.prototype.scrollIntoView = vi.fn();

describe("InteractionsGraph filter combination", () => {
  it("combines the base query with the table's filter via and() (bug #1)", () => {
    render(<InteractionsGraph taxonId={943} q="eq(evidence,experimental)" tableFilter="keyword(groEL*)" keywordValue="groEL" onKeywordChange={vi.fn()} />);

    expect(useInteractions).toHaveBeenCalledWith(943, "and(eq(evidence,experimental),keyword(groEL*))");
  });

  it("strips the base query's URL fragment before combining a table filter", () => {
    render(
      <InteractionsGraph
        taxonId={943}
        q="eq(evidence,experimental)#view_tab=interactions"
        tableFilter="keyword(groEL*)"
        keywordValue="groEL"
        onKeywordChange={vi.fn()}
      />,
    );

    expect(useInteractions).toHaveBeenCalledWith(
      943,
      "and(eq(evidence,experimental),keyword(groEL*))",
    );
  });

  it("uses the bare base query when the table has no active filter", () => {
    render(<InteractionsGraph taxonId={943} q="eq(evidence,experimental)" tableFilter="" keywordValue="" onKeywordChange={vi.fn()} />);

    expect(useInteractions).toHaveBeenCalledWith(943, "eq(evidence,experimental)");
  });

  it("uses the bare base query when tableFilter is omitted entirely", () => {
    render(<InteractionsGraph taxonId={943} q="eq(evidence,experimental)" keywordValue="" onKeywordChange={vi.fn()} />);

    expect(useInteractions).toHaveBeenCalledWith(943, "eq(evidence,experimental)");
  });

  it("reports graph keyword edits to the shared owner without duplicating the current keyword query", () => {
    const onKeywordChange = vi.fn();
    render(
      <InteractionsGraph
        taxonId={943}
        q="eq(evidence,experimental)"
        tableFilter="keyword(groEL*)"
        keywordValue="groEL"
        onKeywordChange={onKeywordChange}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Search interaction results..."), { target: { value: "dnaK" } });

    expect(onKeywordChange).toHaveBeenLastCalledWith("dnaK");
    expect(useInteractions).toHaveBeenLastCalledWith(
      943,
      "and(eq(evidence,experimental),keyword(groEL*))",
    );
  });

  it("preserves table facet filters while reporting graph keyword edits", () => {
    const onKeywordChange = vi.fn();
    render(
      <InteractionsGraph
        taxonId={943}
        q=""
        tableFilter="eq(category,PPI)"
        keywordValue=""
        onKeywordChange={onKeywordChange}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Search interaction results..."), { target: { value: "dnaK" } });

    expect(onKeywordChange).toHaveBeenLastCalledWith("dnaK");
    expect(useInteractions).toHaveBeenLastCalledWith(943, "eq(category,PPI)");
  });
});

// The mock above holds useInteractions on `isPending`, so this exercises the
// real loading branch and guards its wiring: a regression that swaps the
// skeleton back for a blank/centered-text state (the pre-skeleton behavior)
// makes the spinner disappear and fails here. The query-combination suite above
// runs in the same pending state but only asserts the query — it would not
// notice the loading UI reverting.
describe("InteractionsGraph loading state", () => {
  it("renders the loading skeleton while the query is pending", () => {
    render(<InteractionsGraph taxonId={943} q="" keywordValue="" onKeywordChange={vi.fn()} />);

    // Skeleton's Spinner is the single role=status loading announcement.
    expect(screen.getByRole("status")).toBeInTheDocument();
    // Real keyword toolbar stays mounted in every state, loading included.
    expect(screen.getByPlaceholderText("Search interaction results...")).toBeInTheDocument();
  });
});

describe("InteractionsGraph data changes", () => {
  it("clears stale selection and active presets when the query data changes", async () => {
    const user = userEvent.setup();
    vi.mocked(useInteractions).mockReturnValue({
      data: graphRows,
      isPending: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useInteractions>);

    const { rerender } = render(
      <InteractionsGraph
        taxonId={943}
        q=""
        tableFilter="keyword(geneA*)"
        keywordValue="geneA"
        onKeywordChange={vi.fn()}
      />,
    );

    await user.click(screen.getByText("geneA"));
    expect(screen.getByText("node-a")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hub Protein" }));
    await user.click(screen.getByRole("button", { name: "Most Connected Hub" }));
    expect(screen.getByRole("button", { name: "Most Connected Hub" })).toBeInTheDocument();

    vi.mocked(useInteractions).mockReturnValue({
      data: [{ ...graphRows[0], id: "edge-2", interactor_a: "node-c", gene_a: "geneC" }],
      isPending: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useInteractions>);
    rerender(
      <InteractionsGraph
        taxonId={943}
        q=""
        tableFilter="keyword(geneC*)"
        keywordValue="geneC"
        onKeywordChange={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Select a node or edge to see details.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Hub Protein" })).toBeInTheDocument();
    });
    expect(screen.queryByText("node-a")).not.toBeInTheDocument();
  });
});
