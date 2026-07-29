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
    render(<InteractionsGraph taxonId={943} q="eq(evidence,experimental)" tableFilter="keyword(groEL*)" />);

    expect(useInteractions).toHaveBeenCalledWith(943, "and(eq(evidence,experimental),keyword(groEL*))");
  });

  it("uses the bare base query when the table has no active filter", () => {
    render(<InteractionsGraph taxonId={943} q="eq(evidence,experimental)" tableFilter="" />);

    expect(useInteractions).toHaveBeenCalledWith(943, "eq(evidence,experimental)");
  });

  it("uses the bare base query when tableFilter is omitted entirely", () => {
    render(<InteractionsGraph taxonId={943} q="eq(evidence,experimental)" />);

    expect(useInteractions).toHaveBeenCalledWith(943, "eq(evidence,experimental)");
  });

  it("combines the table's filter with the graph's own keyword box (both active)", () => {
    render(<InteractionsGraph taxonId={943} q="eq(evidence,experimental)" tableFilter="keyword(groEL*)" />);

    fireEvent.change(screen.getByPlaceholderText("Search keywords..."), { target: { value: "dnaK" } });

    expect(useInteractions).toHaveBeenLastCalledWith(
      943,
      "and(eq(evidence,experimental),keyword(groEL*),keyword(dnaK*))",
    );
  });

  it("does not mutate or drop the table's filter when the graph's own keyword box changes", () => {
    // Regression: an earlier design had the graph's keyword box write into the
    // SAME shared filter the table reads from, via a required onFilterChange
    // prop. That meant switching to Graph and typing a keyword silently wiped
    // the table's facet selections when switching back — a surprising,
    // unrequested side effect. InteractionsGraph now takes no onFilterChange
    // prop at all; the type signature itself is the regression guard. This
    // test asserts the table's filter fragment survives verbatim, appended
    // to (not replaced by) the graph's own keyword.
    render(<InteractionsGraph taxonId={943} q="" tableFilter="eq(category,PPI)" />);

    fireEvent.change(screen.getByPlaceholderText("Search keywords..."), { target: { value: "dnaK" } });

    expect(useInteractions).toHaveBeenLastCalledWith(943, "and(eq(category,PPI),keyword(dnaK*))");
  });
});
