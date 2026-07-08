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
  // Release Shift on the global KeyStateTracker so a held-shift never leaks
  // into the next test (useKeyHold reads a document-level singleton).
  fireEvent.keyUp(document, { key: "Shift" });
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

  it("unchecking a collapsed parent preserves selected-but-hidden children in onSelect", async () => {
    mockChildren({
      234: [child(235, "Brucella abortus", "species", 581)],
      235: [
        child(1001, "Brucella abortus 544", "strain", 2),
        child(1002, "Brucella abortus 2308", "strain", 1),
      ],
    });
    const onSelect = vi.fn();

    render(<TaxonomyTree rootTaxon={rootTaxon} onSelect={onSelect} />, {
      wrapper: createQueryClientWrapper(),
    });

    // Expand to load strains
    const speciesLink = await screen.findByRole("link", { name: "Brucella abortus" });
    const speciesRow = speciesLink.closest("tr") as HTMLElement;
    fireEvent.click(await within(speciesRow).findByRole("button", { name: "Expand" }));

    // Select parent + both strains
    fireEvent.click(speciesRow);
    fireEvent.click(
      (await screen.findByRole("link", { name: "Brucella abortus 544" })).closest("tr") as HTMLElement,
    );
    fireEvent.click(
      (await screen.findByRole("link", { name: "Brucella abortus 2308" })).closest("tr") as HTMLElement,
    );

    await waitFor(() => {
      expect(onSelect.mock.calls.at(-1)?.[0]).toHaveLength(3);
    });

    // Collapse — strains leave the row model (childrenMap drops entry for 235)
    fireEvent.click(within(speciesRow).getByRole("button", { name: "Collapse" }));

    // Uncheck parent — triggers the selection effect that previously returned 0
    // because getSelectedRowModel() only saw visible rows.
    fireEvent.click(speciesRow);

    await waitFor(() => {
      const lastCall = onSelect.mock.calls.at(-1)?.[0] as TaxonRecord[];
      expect(lastCall).toHaveLength(2);
      expect(lastCall).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ taxon_id: 1001 }),
          expect.objectContaining({ taxon_id: 1002 }),
        ]),
      );
    });
  });

  it("selecting a visible row after accordion collapses includes hidden selected children in onSelect", async () => {
    mockChildren({
      234: [
        child(235, "Brucella abortus", "species", 581),
        child(236, "Brucella melitensis", "species", 400),
      ],
      235: [child(1001, "Brucella abortus 544", "strain", 2)],
    });
    const onSelect = vi.fn();

    render(<TaxonomyTree rootTaxon={rootTaxon} onSelect={onSelect} />, {
      wrapper: createQueryClientWrapper(),
    });

    // Expand Brucella abortus and select its strain
    const speciesLink = await screen.findByRole("link", { name: "Brucella abortus" });
    const speciesRow = speciesLink.closest("tr") as HTMLElement;
    fireEvent.click(await within(speciesRow).findByRole("button", { name: "Expand" }));
    fireEvent.click(
      (await screen.findByRole("link", { name: "Brucella abortus 544" })).closest("tr") as HTMLElement,
    );

    await waitFor(() => {
      expect(onSelect.mock.calls.at(-1)?.[0]).toHaveLength(1);
    });

    // Collapse — strain leaves the row model
    fireEvent.click(within(speciesRow).getByRole("button", { name: "Collapse" }));

    // Select a different visible row — triggers the effect
    await screen.findByRole("link", { name: "Brucella melitensis" });
    fireEvent.click(
      screen.getByRole("link", { name: "Brucella melitensis" }).closest("tr") as HTMLElement,
    );

    // Should count 2: hidden strain + newly selected species
    await waitFor(() => {
      const lastCall = onSelect.mock.calls.at(-1)?.[0] as TaxonRecord[];
      expect(lastCall).toHaveLength(2);
      expect(lastCall).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ taxon_id: 1001 }),
          expect.objectContaining({ taxon_id: 236 }),
        ]),
      );
    });
  });

  it("shift-clicking a row selects the full range between anchor and target", async () => {
    mockChildren({
      234: [
        child(235, "Brucella abortus", "species", 581),
        child(236, "Brucella melitensis", "species", 400),
        child(237, "Brucella suis", "species", 300),
      ],
    });
    const onSelect = vi.fn();

    render(<TaxonomyTree rootTaxon={rootTaxon} onSelect={onSelect} />, {
      wrapper: createQueryClientWrapper(),
    });

    // Rows in visible order: root (234), 235, 236, 237.
    const firstRow = (await screen.findByRole("link", { name: "Brucella abortus" })).closest("tr") as HTMLElement;
    const lastRow = (await screen.findByRole("link", { name: "Brucella suis" })).closest("tr") as HTMLElement;

    // Plain click sets the anchor.
    fireEvent.click(firstRow);
    await waitFor(() => {
      expect(onSelect.mock.calls.at(-1)?.[0]).toHaveLength(1);
    });

    // Shift held → click the last species. Everything between anchor and target
    // (235, 236, 237) becomes selected.
    fireEvent.keyDown(document, { key: "Shift" });
    fireEvent.click(lastRow);

    await waitFor(() => {
      const last = onSelect.mock.calls.at(-1)?.[0] as TaxonRecord[];
      expect(last).toHaveLength(3);
      expect(last).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ taxon_id: 235 }),
          expect.objectContaining({ taxon_id: 236 }),
          expect.objectContaining({ taxon_id: 237 }),
        ]),
      );
    });
  });

  it("shift-clicking selects the range regardless of click direction (target above anchor)", async () => {
    mockChildren({
      234: [
        child(235, "Brucella abortus", "species", 581),
        child(236, "Brucella melitensis", "species", 400),
        child(237, "Brucella suis", "species", 300),
      ],
    });
    const onSelect = vi.fn();

    render(<TaxonomyTree rootTaxon={rootTaxon} onSelect={onSelect} />, {
      wrapper: createQueryClientWrapper(),
    });

    const middleRow = (await screen.findByRole("link", { name: "Brucella melitensis" })).closest("tr") as HTMLElement;
    const firstRow = (await screen.findByRole("link", { name: "Brucella abortus" })).closest("tr") as HTMLElement;

    // Anchor on the middle row, then shift-click upward to the first.
    fireEvent.click(middleRow);
    await waitFor(() => {
      expect(onSelect.mock.calls.at(-1)?.[0]).toHaveLength(1);
    });

    fireEvent.keyDown(document, { key: "Shift" });
    fireEvent.click(firstRow);

    await waitFor(() => {
      const last = onSelect.mock.calls.at(-1)?.[0] as TaxonRecord[];
      expect(last).toHaveLength(2);
      expect(last).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ taxon_id: 235 }),
          expect.objectContaining({ taxon_id: 236 }),
        ]),
      );
    });
  });

  it("shift-clicking without a prior selection falls back to selecting just the clicked row", async () => {
    mockChildren({
      234: [
        child(235, "Brucella abortus", "species", 581),
        child(236, "Brucella melitensis", "species", 400),
      ],
    });
    const onSelect = vi.fn();

    render(<TaxonomyTree rootTaxon={rootTaxon} onSelect={onSelect} />, {
      wrapper: createQueryClientWrapper(),
    });

    const row = (await screen.findByRole("link", { name: "Brucella melitensis" })).closest("tr") as HTMLElement;

    // No anchor yet → shift-click behaves like a plain toggle.
    fireEvent.keyDown(document, { key: "Shift" });
    fireEvent.click(row);

    await waitFor(() => {
      const last = onSelect.mock.calls.at(-1)?.[0] as TaxonRecord[];
      expect(last).toHaveLength(1);
      expect(last).toEqual([expect.objectContaining({ taxon_id: 236 })]);
    });
  });

  it("shift-clicking a checkbox selects the full range between anchor and target", async () => {
    mockChildren({
      234: [
        child(235, "Brucella abortus", "species", 581),
        child(236, "Brucella melitensis", "species", 400),
        child(237, "Brucella suis", "species", 300),
      ],
    });
    const onSelect = vi.fn();

    render(<TaxonomyTree rootTaxon={rootTaxon} onSelect={onSelect} />, {
      wrapper: createQueryClientWrapper(),
    });

    const firstCb = await screen.findByRole("checkbox", { name: "Select Brucella abortus" });
    const lastCb = screen.getByRole("checkbox", { name: "Select Brucella suis" });

    // Plain checkbox click sets the anchor.
    fireEvent.click(firstCb);
    await waitFor(() => {
      expect(onSelect.mock.calls.at(-1)?.[0]).toHaveLength(1);
    });

    // Shift held → checkbox click on last species selects 235, 236, 237.
    fireEvent.keyDown(document, { key: "Shift" });
    fireEvent.click(lastCb);

    await waitFor(() => {
      const last = onSelect.mock.calls.at(-1)?.[0] as TaxonRecord[];
      expect(last).toHaveLength(3);
      expect(last).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ taxon_id: 235 }),
          expect.objectContaining({ taxon_id: 236 }),
          expect.objectContaining({ taxon_id: 237 }),
        ]),
      );
    });
  });

  it("shift-clicking a checkbox selects the range regardless of direction (target above anchor)", async () => {
    mockChildren({
      234: [
        child(235, "Brucella abortus", "species", 581),
        child(236, "Brucella melitensis", "species", 400),
        child(237, "Brucella suis", "species", 300),
      ],
    });
    const onSelect = vi.fn();

    render(<TaxonomyTree rootTaxon={rootTaxon} onSelect={onSelect} />, {
      wrapper: createQueryClientWrapper(),
    });

    const middleCb = await screen.findByRole("checkbox", { name: "Select Brucella melitensis" });
    const firstCb = screen.getByRole("checkbox", { name: "Select Brucella abortus" });

    fireEvent.click(middleCb);
    await waitFor(() => {
      expect(onSelect.mock.calls.at(-1)?.[0]).toHaveLength(1);
    });

    fireEvent.keyDown(document, { key: "Shift" });
    fireEvent.click(firstCb);

    await waitFor(() => {
      const last = onSelect.mock.calls.at(-1)?.[0] as TaxonRecord[];
      expect(last).toHaveLength(2);
      expect(last).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ taxon_id: 235 }),
          expect.objectContaining({ taxon_id: 236 }),
        ]),
      );
    });
  });

  it("shift-clicking a checkbox without a prior anchor falls back to toggling just that row", async () => {
    mockChildren({
      234: [
        child(235, "Brucella abortus", "species", 581),
        child(236, "Brucella melitensis", "species", 400),
      ],
    });
    const onSelect = vi.fn();

    render(<TaxonomyTree rootTaxon={rootTaxon} onSelect={onSelect} />, {
      wrapper: createQueryClientWrapper(),
    });

    const cb = await screen.findByRole("checkbox", { name: "Select Brucella melitensis" });

    fireEvent.keyDown(document, { key: "Shift" });
    fireEvent.click(cb);

    await waitFor(() => {
      const last = onSelect.mock.calls.at(-1)?.[0] as TaxonRecord[];
      expect(last).toHaveLength(1);
      expect(last).toEqual([expect.objectContaining({ taxon_id: 236 })]);
    });
  });

  it("checkbox click sets anchor for a subsequent row-body shift-click", async () => {
    mockChildren({
      234: [
        child(235, "Brucella abortus", "species", 581),
        child(236, "Brucella melitensis", "species", 400),
        child(237, "Brucella suis", "species", 300),
      ],
    });
    const onSelect = vi.fn();

    render(<TaxonomyTree rootTaxon={rootTaxon} onSelect={onSelect} />, {
      wrapper: createQueryClientWrapper(),
    });

    // Set anchor via checkbox click.
    const firstCb = await screen.findByRole("checkbox", { name: "Select Brucella abortus" });
    fireEvent.click(firstCb);
    await waitFor(() => {
      expect(onSelect.mock.calls.at(-1)?.[0]).toHaveLength(1);
    });

    // Shift + row-body click on last species should range from the checkbox anchor.
    const lastRow = screen.getByRole("link", { name: "Brucella suis" }).closest("tr") as HTMLElement;
    fireEvent.keyDown(document, { key: "Shift" });
    fireEvent.click(lastRow);

    await waitFor(() => {
      const last = onSelect.mock.calls.at(-1)?.[0] as TaxonRecord[];
      expect(last).toHaveLength(3);
      expect(last).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ taxon_id: 235 }),
          expect.objectContaining({ taxon_id: 236 }),
          expect.objectContaining({ taxon_id: 237 }),
        ]),
      );
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
