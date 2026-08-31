import { applyBackendMocks, expect, test } from "../mocks/backends";
import { permissiveBackendOverrides } from "../fixtures/overrides";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Epitope view", () => {
  test.beforeEach(async ({ page }) => {
    await applyBackendMocks(page, { overrides: [...permissiveBackendOverrides] });
  });

  test("searches the full collection and opens the canonical member and assays", async ({ page }) => {
    await page.goto("/");
    const welcomeSearch = page.locator(".welcome-search-card form");
    await welcomeSearch.getByRole("combobox", { name: "Search type" }).click();
    await page.getByRole("option", { name: "Epitopes" }).click();
    await welcomeSearch.getByRole("textbox").fill("Brucella");

    const keywordRequest = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return url.pathname === "/api/data/epitope" && url.searchParams.get("keyword") === "Brucella";
    });
    await welcomeSearch.getByRole("textbox").press("Enter");
    await keywordRequest;

    await expect(page).toHaveURL(/\/epitope\?keyword=Brucella$/);
    await expect(page.getByRole("heading", { level: 1, name: "Epitopes" })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("combobox", { name: "Search type" })).toContainText("Epitopes");
    await expect(page.getByRole("banner").getByRole("textbox")).toHaveValue("Brucella");
    await expect(page.getByPlaceholder("Search keywords...")).toHaveValue("");
    await expect(page.getByRole("link", { name: "15780" })).toHaveAttribute("href", "/epitope/15780");

    const collectionRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/data/epitope") {
        collectionRequests.push(request.url());
      }
    });
    const localKeyword = page.getByPlaceholder("Search keywords...");
    await localKeyword.fill("hemagglutinin");
    await page.waitForTimeout(400);
    await expect(page.getByRole("link", { name: "15780" })).toBeVisible();
    await expect(page).toHaveURL(/\/epitope\?keyword=Brucella$/);
    expect(collectionRequests).toEqual([]);

    await localKeyword.fill("not in returned rows");
    await expect(page.getByRole("link", { name: "15780" })).toHaveCount(0);
    await expect(page.getByText("No results")).toBeVisible();
    await page.waitForTimeout(400);
    await expect(page).toHaveURL(/\/epitope\?keyword=Brucella$/);
    expect(collectionRequests).toEqual([]);

    await localKeyword.clear();
    await expect(page.getByRole("link", { name: "15780" })).toBeVisible();
    await page.waitForTimeout(400);
    expect(collectionRequests).toEqual([]);

    await page.getByRole("button", { name: "Show Filters" }).click();
    const facetRequest = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return (
        url.pathname === "/api/data/epitope" &&
        url.searchParams.get("keyword") === "Brucella"
      );
    });
    await page.getByRole("button", { name: "Discontinuous peptide (1)" }).click();
    await facetRequest;
    await expect(page).toHaveURL(
      /\/epitope\?keyword=Brucella&epitope_type=Discontinuous\+peptide$/,
    );

    await page.getByRole("link", { name: "15780" }).click();
    await expect(page).toHaveURL(/\/epitope\/15780$/);
    await expect(page.getByText("A1, C4, D8").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /View in IEDB/ })).toHaveAttribute("href", "https://www.iedb.org/epitope/15780");

    const assayRequest = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return url.pathname === "/api/data/epitope_assay" && url.searchParams.get("rql") === "eq(epitope_id,15780)";
    });
    await page.getByRole("button", { name: "Assays" }).click();
    await assayRequest;
    await expect(page).toHaveURL(/\?tab=assays$/);
    await expect(page.getByText("ELISA")).toBeVisible();
    await expect(page.getByText("Neutralization")).toBeVisible();
  });

  test("shows empty and failed assay states without losing the member shell", async ({ page }) => {
    await page.route(/\/api\/data\/epitope_assay(?:\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rows: [], total: 0, facets: {}, page: 1, pageSize: 200 }),
      });
    });
    await page.goto("/epitope/15780?tab=assays");
    await expect(page.getByText("No results")).toBeVisible();
    await expect(page.getByRole("link", { name: /View in IEDB/ })).toBeVisible();

    await page.unroute(/\/api\/data\/epitope_assay(?:\?|$)/);
    await page.route(/\/api\/data\/epitope_assay(?:\?|$)/, async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Epitope assay backend unavailable" }),
      });
    });
    await page.reload();
    await expect(page.getByText(/Epitope assay backend unavailable/)).toBeVisible();
  });
});
