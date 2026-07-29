import { useEffect } from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import { InteractionsSubviewShell } from "../interactions-subview-shell";

// Table must stay self-managing (own filter, own pagination/sorting) so it can
// survive the Graph round-trip — the shell only *observes* its filter via
// onFilterChange, it never feeds a `filter` prop back down. Asserting on
// `data-filter` (like the previous version of this test did) only proves the
// mock's re-render saw the right value; it would pass even if the real
// TaxonDataPanel/ListData subtree were destroyed and recreated with blank
// internal state on every switch — which is exactly the bug this fix
// addresses (FilterBar owns its own keywords/selected state and re-emits ""
// on mount). A mount counter proves the component instance itself survives.
let tableMountCount = 0;
vi.mock("@/app/(views)/taxonomy/[taxonId]/_components/taxon-data-panel", () => ({
  TaxonDataPanel: ({ onFilterChange }: { onFilterChange?: (rql: string) => void }) => {
    useEffect(() => {
      tableMountCount++;
    }, []);
    return (
      <div data-testid="table-panel">
        <button onClick={() => { onFilterChange?.("keyword(fromTable*)"); }}>set-from-table</button>
      </div>
    );
  },
}));

vi.mock("../interactions-graph", () => ({
  InteractionsGraph: ({ tableFilter }: { tableFilter?: string }) => (
    <div data-testid="graph-panel" data-table-filter={tableFilter}>graph</div>
  ),
}));

beforeEach(() => {
  tableMountCount = 0;
});

describe("InteractionsSubviewShell", () => {
  it("keeps the Table subview mounted across a switch to Graph and back (bug #3 root cause)", () => {
    render(<InteractionsSubviewShell taxonId={943} q="eq(evidence,experimental)" />);
    expect(tableMountCount).toBe(1);

    fireEvent.click(screen.getByRole("tab", { name: "Graph" }));
    fireEvent.click(screen.getByRole("tab", { name: "Table" }));

    // Still 1: base-ui's Tabs.Panel keepMounted keeps the same instance alive
    // instead of unmounting on hide and remounting on reveal.
    expect(tableMountCount).toBe(1);
  });

  it("passes the table's current filter into the graph subview as tableFilter (bug #1)", () => {
    render(<InteractionsSubviewShell taxonId={943} q="eq(evidence,experimental)" />);

    fireEvent.click(screen.getByText("set-from-table"));
    fireEvent.click(screen.getByRole("tab", { name: "Graph" }));

    expect(screen.getByTestId("graph-panel")).toHaveAttribute("data-table-filter", "keyword(fromTable*)");
  });

  it("starts the graph subview with an empty tableFilter before any table filtering", () => {
    render(<InteractionsSubviewShell taxonId={943} q="eq(evidence,experimental)" />);

    fireEvent.click(screen.getByRole("tab", { name: "Graph" }));

    expect(screen.getByTestId("graph-panel")).toHaveAttribute("data-table-filter", "");
  });
});
