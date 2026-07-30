import { render, screen, fireEvent } from "@testing-library/react";

import { InteractionsGraph } from "../interactions-graph";
import { useInteractions } from "@/lib/interactions/use-interactions";

// InteractionsGraph only reaches SigmaCanvas (WebGL, untestable in jsdom —
// see docs/architecture.md / testing.md canvas exclusion) once useInteractions
// resolves with rows. Mocking it pending keeps the component on its "Loading
// interactions…" branch, which is enough to observe what query it built.
vi.mock("@/lib/interactions/use-interactions", () => ({
  useInteractions: vi.fn(() => ({ data: undefined, isPending: true, isError: false, error: null })),
}));

describe("InteractionsGraph filter combination", () => {
  it("combines the base query with the table's filter via and() (bug #1)", () => {
    render(<InteractionsGraph taxonId={943} q="eq(evidence,experimental)" tableFilter="keyword(groEL*)" keywordValue="groEL" onKeywordChange={vi.fn()} />);

    expect(useInteractions).toHaveBeenCalledWith(943, "and(eq(evidence,experimental),keyword(groEL*))");
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

    fireEvent.change(screen.getByPlaceholderText("Search keywords..."), { target: { value: "dnaK" } });

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

    fireEvent.change(screen.getByPlaceholderText("Search keywords..."), { target: { value: "dnaK" } });

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
    expect(screen.getByPlaceholderText("Search keywords...")).toBeInTheDocument();
  });
});
