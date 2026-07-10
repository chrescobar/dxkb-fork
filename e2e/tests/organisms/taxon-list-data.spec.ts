import { test, expect, applyBackendMocks, type JsonOverride } from "../../mocks/backends";
import { permissiveBackendOverrides } from "../../fixtures/overrides";

test.use({ storageState: { cookies: [], origins: [] } });

// Force the strain data API to return 500 so we can assert the error-handling path.
const strainApi500: JsonOverride = {
  url: /\/api\/e2e-mock\/data\/strain\//,
  method: "GET",
  status: 500,
  body: { error: "Internal Server Error" },
};

test.describe("taxon strains tab: data API error handling", () => {
  test.beforeEach(async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [strainApi500, ...permissiveBackendOverrides],
    });
  });

  test("shows error in table body and keeps all controls visible when data API returns 500", async ({ page }) => {
    await page.goto("/taxonomy/234?tab=strains");

    // Error message must appear in the table body (not replace the whole page).
    await expect(page.getByText(/Failed to fetch metadata/)).toBeVisible({ timeout: 10_000 });

    // HTTP status code must be included in the error message.
    await expect(page.getByText(/500/)).toBeVisible();

    // Table toolbar controls must remain visible (proves the page wasn't replaced by a bare error div).
    await expect(page.getByRole("button", { name: /Download \(CSV\)/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Columns/i })).toBeVisible();

    // Navigation sidebar must still be present.
    await expect(page.getByRole("button", { name: "Strains" })).toBeVisible();
  });
});
