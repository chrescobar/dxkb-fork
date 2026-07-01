import { test, expect, applyBackendMocks, type JsonOverride } from "../mocks/backends";
import { permissiveBackendOverrides } from "../fixtures/overrides";

test.use({ storageState: { cookies: [], origins: [] } });

// Children of a node arrive as a bare array with a Content-Range total. The tree
// pages Range until that total is reached; keeping each fixture <= 25 rows means a
// single page satisfies the loop (the mock ignores Range and returns the full set).
function childrenOverride(parentId: number, rows: Record<string, unknown>[]): JsonOverride {
  return {
    // parent_id<sep>ID where sep is a literal comma or its %2C encoding. Not [^0-9]+:
    // the "2" in "%2C" is a digit, so that would mis-split the encoded separator.
    // (?![0-9]) guards against matching a longer id (234 must not match 2345).
    // (?!\)) so this doesn't hijack the facet request's in(parent_id,(…)) form.
    url: new RegExp(`/api/e2e-mock/data/taxonomy/\\?.*parent_id(?:,|%2C)${String(parentId)}(?![0-9])`),
    method: "GET",
    body: rows,
    headers: { "Content-Range": `items 0-${String(rows.length)}/${String(rows.length)}` },
  };
}

// The tree asks for every visible node's child count in one faceted request; the
// Data API answers in a `facet_counts` header (flat [id, count, …] array). Only
// nodes with a count > 0 get an expand arrow, so this must be mocked or no row is
// expandable. Registered before childrenOverride (first match wins) since its URL
// also contains parent_id.
function childCountsOverride(counts: Record<number, number>): JsonOverride {
  const flat = Object.entries(counts).flatMap(([id, n]) => [id, n]);
  return {
    url: /\/api\/e2e-mock\/data\/taxonomy\/\?.*facet/,
    method: "GET",
    body: [],
    headers: {
      "Content-Range": "items 0-0/0",
      facet_counts: JSON.stringify({ facet_fields: { parent_id: flat } }),
    },
  };
}

const speciesChildren = [
  { taxon_id: 235, taxon_name: "Brucella abortus", taxon_rank: "species", parent_id: 234, genomes: 581 },
  { taxon_id: 236, taxon_name: "Brucella melitensis", taxon_rank: "species", parent_id: 234, genomes: 400 },
];

const abortusStrains = [
  { taxon_id: 99935, taxon_name: "Brucella abortus 544", taxon_rank: "strain", parent_id: 235, genomes: 2 },
];

test.describe("taxonomy tree tab", () => {
  test.beforeEach(async ({ page }) => {
    await applyBackendMocks(page, {
      // Facet child-counts first (its URL also has parent_id, so it must win over
      // childrenOverride), then specific children, then permissive for the rest.
      // 235 has strains (→ expand arrow), 236 has none.
      overrides: [
        childCountsOverride({ 235: 1, 236: 0 }),
        childrenOverride(234, speciesChildren),
        childrenOverride(235, abortusStrains),
        ...permissiveBackendOverrides,
      ],
    });
  });

  test("auto-expands genus, lazily expands a species to its strains, and opens the panel", async ({ page }) => {
    await page.goto("/taxonomy/234?tab=taxonomy");

    // Root genus row + auto-expanded species children.
    await expect(page.getByRole("link", { name: "Brucella", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Brucella abortus", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Brucella melitensis" })).toBeVisible();

    // Expand the species → its strain children lazy-load beneath it.
    const speciesRow = page.locator("tr", {
      has: page.getByRole("link", { name: "Brucella abortus", exact: true }),
    });
    await speciesRow.getByRole("button", { name: "Expand" }).click();

    const strainLink = page.getByRole("link", { name: "Brucella abortus 544" });
    await expect(strainLink).toBeVisible();

    // Strain is a leaf — no expand/collapse toggle.
    const strainRow = page.locator("tr", { has: strainLink });
    await expect(strainRow.getByRole("button", { name: /Expand|Collapse/ })).toHaveCount(0);

    // Clicking the row body opens the detail panel (the "Taxon ID" label only
    // appears in the panel, never in the tree's Name/Rank/Genomes columns).
    await strainRow.click();
    await expect(page.getByText("Taxon ID")).toBeVisible();
  });

  test("filters the loaded rows by name", async ({ page }) => {
    await page.goto("/taxonomy/234?tab=taxonomy");
    await expect(page.getByRole("link", { name: "Brucella abortus", exact: true })).toBeVisible();

    await page.getByRole("searchbox", { name: "Search by taxonomy name" }).fill("melitensis");

    await expect(page.getByRole("link", { name: "Brucella melitensis" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Brucella abortus", exact: true })).toHaveCount(0);
  });
});
