import { test, expect, applyBackendMocks } from "../../mocks/backends";
import { permissiveBackendOverrides } from "../../fixtures/overrides";

test.use({ storageState: { cookies: [], origins: [] } });

// In E2E, NEXT_PUBLIC_DATA_API=http://127.0.0.1:${E2E_PORT}/api/e2e-mock/data so all
// serology fetches (count, rows) go through the loopback, not bv-brc.org.
const seroLoopback = /\/api\/e2e-mock\/data\/serology\//;
// Match `limit` only (not `limit(1)`): Chromium percent-encodes the parens in
// the outbound URL, so a literal `\(1\)` never matches request.url(). The count
// query is the only serology request carrying `limit`, so this stays unambiguous.
const seroLoopbackCount = /\/api\/e2e-mock\/data\/serology\/.*limit/;
const SEROLOGY_TAXON_ID = "2955291"; // Alphainfluenzavirus influenzae — hasSerology = true

function buildSerologyRows(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `sero-${String(i).padStart(4, "0")}`,
    // sample_identifier is the first visible column — assert on it, not `id`
    // (the row key), which the table never renders as a cell.
    sample_identifier: `sample-${String(i)}`,
    host_common_name: "Domestic Cat",
    test_type: "ELISA/IDEXX Flu Ab",
    test_result: "Negative",
    collection_date: "2008-11-02T16:54:39Z",
  }));
}

test.describe("taxon serology tab", () => {
  test("renders serology rows for the taxon", async ({ page }) => {
    const rows = buildSerologyRows(3);

    await applyBackendMocks(page, {
      overrides: [
        { url: seroLoopbackCount, method: "GET", body: { response: { numFound: 3 } } },
        { url: seroLoopback, method: "GET", body: rows },
        ...permissiveBackendOverrides,
      ],
    });

    await page.goto(`/taxonomy/${SEROLOGY_TAXON_ID}?tab=serology`);
    await expect(page).toHaveURL(/tab=serology/);
    await expect(page.getByText("Showing 1-3 of 3 results")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("sample-0")).toBeVisible();
    await expect(page.getByRole("button", { name: "Serology" })).toBeVisible();
  });
});
