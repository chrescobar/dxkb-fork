import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import type { TaxonRecord } from "../taxon-tree-types";

const { mockPush, treePropsSpy } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  treePropsSpy: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Replace the real tree (virtualizer + TanStack Query + facet fetches) with a
// stub that just exposes a button to drive onSelect. This test only covers the
// panel's action wiring, not the tree.
vi.mock("../taxonomy-tree", () => ({
  TaxonomyTree: ({
    rootTaxa,
    onSelect,
  }: {
    rootTaxa: readonly OrganismTaxonomy[];
    onSelect?: (rows: TaxonRecord[]) => void;
  }) => {
    treePropsSpy(rootTaxa);
    return (
      <div>
        <button
          type="button"
          onClick={() =>
            onSelect?.([
              { taxon_id: 234, taxon_name: "Brucella", taxon_rank: "genus" },
            ])
          }
        >
          select-one
        </button>
        <button
          type="button"
          onClick={() =>
            onSelect?.([
              { taxon_id: 234, taxon_name: "Brucella", taxon_rank: "genus" },
              {
                taxon_id: 10239,
                taxon_name: "Viruses",
                taxon_rank: "superkingdom",
              },
            ])
          }
        >
          select-two
        </button>
      </div>
    );
  },
}));

import { TaxonomyTreePanel } from "../taxonomy-tree-panel";

beforeAll(() => {
  // ResourceWorkspace's resizable panels need ResizeObserver, absent in jsdom.
  globalThis.ResizeObserver = class {
    observe = () => undefined;
    unobserve = () => undefined;
    disconnect = () => undefined;
  };
});

beforeEach(() => {
  mockPush.mockClear();
  treePropsSpy.mockClear();
});

const taxon = {
  taxonId: 234,
  taxonName: "Brucella",
  taxonRank: "genus",
} as unknown as OrganismTaxonomy;

describe("TaxonomyTreePanel", () => {
  it("forwards every root to the tree in order", () => {
    const viruses = {
      taxonId: 10239,
      taxonName: "Viruses",
      taxonRank: "superkingdom",
    } as unknown as OrganismTaxonomy;

    render(<TaxonomyTreePanel taxa={[taxon, viruses]} />);

    expect(treePropsSpy).toHaveBeenLastCalledWith([taxon, viruses]);
  });

  it("navigates to the taxon overview when Taxon Overview is clicked with one row", async () => {
    render(<TaxonomyTreePanel taxa={[taxon]} />);

    await userEvent.click(screen.getByRole("button", { name: "select-one" }));
    await userEvent.click(
      screen.getByRole("button", { name: /taxon\s*overview/i }),
    );

    expect(mockPush).toHaveBeenCalledWith("/taxonomy/234?tab=overview");
  });

  it("hides Taxon Overview when multiple rows are selected", async () => {
    render(<TaxonomyTreePanel taxa={[taxon]} />);

    await userEvent.click(screen.getByRole("button", { name: "select-two" }));

    expect(
      screen.queryByRole("button", { name: /taxon\s*overview/i }),
    ).not.toBeInTheDocument();
  });
});
