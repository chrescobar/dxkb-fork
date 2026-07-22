import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import type { TaxonRecord } from "../taxon-tree-types";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Replace the real tree (virtualizer + TanStack Query + facet fetches) with a
// stub that just exposes a button to drive onSelect. This test only covers the
// panel's action wiring, not the tree.
vi.mock("../taxonomy-tree", () => ({
  TaxonomyTree: ({ onSelect }: { onSelect?: (rows: TaxonRecord[]) => void }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onSelect?.([{ taxon_id: 234, taxon_name: "Brucella", taxon_rank: "genus" }])
        }
      >
        select-one
      </button>
      <button
        type="button"
        onClick={() =>
          onSelect?.([
            { taxon_id: 234, taxon_name: "Brucella", taxon_rank: "genus" },
            { taxon_id: 235, taxon_name: "Brucella abortus", taxon_rank: "species" },
          ])
        }
      >
        select-two
      </button>
    </div>
  ),
}));

import { TaxonomyTreePanel } from "../taxonomy-tree-panel";

beforeAll(() => {
  // GenomeShell's resizable panels need ResizeObserver, absent in jsdom.
  globalThis.ResizeObserver = class {
    observe = () => undefined;
    unobserve = () => undefined;
    disconnect = () => undefined;
  };
});

beforeEach(() => {
  mockPush.mockClear();
});

const taxon = {
  taxonId: 234,
  taxonName: "Brucella",
  taxonRank: "genus",
} as unknown as OrganismTaxonomy;

describe("TaxonomyTreePanel", () => {
  it("navigates to the taxon overview when Taxon Overview is clicked with one row", async () => {
    render(<TaxonomyTreePanel taxon={taxon} />);

    await userEvent.click(screen.getByRole("button", { name: "select-one" }));
    await userEvent.click(screen.getByRole("button", { name: /taxon\s*overview/i }));

    expect(mockPush).toHaveBeenCalledWith("/taxonomy/234?tab=overview");
  });

  it("hides Taxon Overview when multiple rows are selected", async () => {
    render(<TaxonomyTreePanel taxon={taxon} />);

    await userEvent.click(screen.getByRole("button", { name: "select-two" }));

    expect(screen.queryByRole("button", { name: /taxon\s*overview/i })).not.toBeInTheDocument();
  });
});
