import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { server } from "@/test-helpers/msw-server";
import { createQueryClientWrapper } from "@/test-helpers/api-route-helpers";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

import { TaxonomyTree } from "../taxonomy-tree";
import type { TaxonRecord } from "../taxon-tree-types";

// useVirtualizer measures the scroll container via ResizeObserver / getBoundingClientRect,
// neither of which works in jsdom (0 layout height → 0 rows rendered). Mock it to return
// all items synchronously so tests assert on row content without the virtualizer's async
// measurement lifecycle. Same mock as reference-genomes-client.test.tsx.
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({
    count,
    estimateSize,
  }: {
    count: number;
    estimateSize: () => number;
  }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        start: index * estimateSize(),
        size: estimateSize(),
        end: (index + 1) * estimateSize(),
        key: index,
        lane: 0,
      })),
    getTotalSize: () => count * estimateSize(),
    measure: vi.fn(),
  }),
}));

const dataApi = "https://data.test/api";

const rootTaxon: OrganismTaxonomy = {
  taxonId: 234,
  taxonName: "Brucella",
  lineageNames: [],
  lineageIds: [],
  taxonRank: "genus",
  genomes: 1909,
};

function child(id: number, name: string, rank: string, genomes: number): TaxonRecord {
  return { taxon_id: id, taxon_name: name, taxon_rank: rank, parent_id: 234, genomes };
}

// parentId -> rows, served with a Content-Range covering the whole set in one page.
// Also answers the tree's batched child-count request: in(parent_id,(…))&facet →
// a facet_counts header with each listed parent's child count (from byParent), so
// expand arrows appear for nodes that have children.
function mockChildren(byParent: Record<number, TaxonRecord[]>) {
  server.use(
    http.get(`${dataApi}/taxonomy/`, ({ request }) => {
      const query = new URL(request.url).search;

      if (query.includes("facet")) {
        const inMatch = /in\(parent_id,\(([\d,]+)\)\)/.exec(query);
        const ids = inMatch ? inMatch[1].split(",").map(Number) : [];
        const flat = ids.flatMap((id) => [String(id), (byParent[id] ?? []).length]);
        return HttpResponse.json([], {
          headers: {
            "Content-Range": "items 0-0/0",
            facet_counts: JSON.stringify({ facet_fields: { parent_id: flat } }),
          },
        });
      }

      const match = /eq\(parent_id,(\d+)\)/.exec(query);
      const parentId = match ? Number(match[1]) : -1;
      const rows = byParent[parentId] ?? [];
      return HttpResponse.json(rows, {
        headers: { "Content-Range": `items 0-${String(rows.length)}/${String(rows.length)}` },
      });
    }),
  );
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_DATA_API = dataApi;
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_DATA_API;
});

describe("TaxonomyTree", () => {
  it("auto-expands the root one level and lists children by name", async () => {
    mockChildren({
      234: [
        child(235, "Brucella abortus", "species", 581),
        child(236, "Brucella melitensis", "species", 400),
      ],
    });

    render(<TaxonomyTree rootTaxon={rootTaxon} />, { wrapper: createQueryClientWrapper() });

    expect(screen.getByRole("link", { name: "Brucella" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Brucella abortus" })).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "Brucella melitensis" })).toBeInTheDocument();
  });

  it("lazily loads a species' strains when its toggle is clicked", async () => {
    mockChildren({
      234: [child(235, "Brucella abortus", "species", 581)],
      235: [child(999, "Brucella abortus 544", "strain", 2)],
    });

    render(<TaxonomyTree rootTaxon={rootTaxon} />, { wrapper: createQueryClientWrapper() });

    const speciesLink = await screen.findByRole("link", { name: "Brucella abortus" });
    const speciesRow = speciesLink.closest("tr");
    expect(speciesRow).not.toBeNull();
    // The expand arrow appears once the batched child-count facet resolves (async).
    const expandBtn = await within(speciesRow as HTMLElement).findByRole("button", { name: "Expand" });
    fireEvent.click(expandBtn);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Brucella abortus 544" })).toBeInTheDocument();
    });
  });

  it("renders strain (leaf) rows without an expand toggle", async () => {
    mockChildren({
      234: [child(235, "Brucella abortus", "species", 581)],
      235: [child(999, "Brucella abortus 544", "strain", 2)],
    });

    render(<TaxonomyTree rootTaxon={rootTaxon} />, { wrapper: createQueryClientWrapper() });

    const speciesLink = await screen.findByRole("link", { name: "Brucella abortus" });
    fireEvent.click(
      await within(speciesLink.closest("tr") as HTMLElement).findByRole("button", { name: "Expand" }),
    );

    const strainLink = await screen.findByRole("link", { name: "Brucella abortus 544" });
    const strainRow = strainLink.closest("tr");
    expect(within(strainRow as HTMLElement).queryByRole("button", { name: /Expand|Collapse/ })).toBeNull();
  });

  it("clicking a row body calls onSelect with the selected taxon records", async () => {
    mockChildren({ 234: [child(235, "Brucella abortus", "species", 581)] });
    const onSelect = vi.fn();

    render(<TaxonomyTree rootTaxon={rootTaxon} onSelect={onSelect} />, {
      wrapper: createQueryClientWrapper(),
    });

    const speciesLink = await screen.findByRole("link", { name: "Brucella abortus" });
    fireEvent.click(speciesLink.closest("tr") as HTMLElement);

    // onSelect fires with the full selected-row array (driven by the selection
    // effect), not a single record. Assert the row landed in the latest call.
    await waitFor(() => {
      expect(onSelect).toHaveBeenLastCalledWith([
        expect.objectContaining({ taxon_id: 235 }),
      ]);
    });
  });

  it("filters loaded rows by name", async () => {
    mockChildren({
      234: [
        child(235, "Brucella abortus", "species", 581),
        child(236, "Brucella melitensis", "species", 400),
      ],
    });

    render(<TaxonomyTree rootTaxon={rootTaxon} />, { wrapper: createQueryClientWrapper() });

    await screen.findByRole("link", { name: "Brucella abortus" });

    fireEvent.change(screen.getByRole("searchbox", { name: "Search by taxonomy name" }), {
      target: { value: "melitensis" },
    });

    expect(screen.queryByRole("link", { name: "Brucella abortus" })).toBeNull();
    expect(screen.getByRole("link", { name: "Brucella melitensis" })).toBeInTheDocument();
  });
});
