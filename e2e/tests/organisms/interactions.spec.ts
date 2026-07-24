import { test, applyBackendMocks } from "../../mocks/backends";
import { buildPpiRows, buildPpiOverrides, permissiveBackendOverrides } from "../../fixtures/overrides";
import { TaxonInteractionsPage } from "../../pages";

test.use({ storageState: { cookies: [], origins: [] } });

const INTERACTIONS_TAXON_ID = "234"; // Brucella - lineage includes Bacteria

async function setupInteractionsPage(
  page: Parameters<typeof applyBackendMocks>[0],
  rows = buildPpiRows(3),
) {
  await applyBackendMocks(page, {
    overrides: [...buildPpiOverrides(rows), ...permissiveBackendOverrides],
  });

  const interactionsPage = new TaxonInteractionsPage(page);
  await interactionsPage.goto(INTERACTIONS_TAXON_ID);
  return interactionsPage;
}

test.describe("taxon interactions tab", () => {
  test("renders PPI rows for the bacterial taxon", async ({ page }) => {
    const interactionsPage = await setupInteractionsPage(page);

    await interactionsPage.expectResultCount("Showing 1-3 of 3 results");
    await interactionsPage.expectInteractor("fig|224914.16.peg.600");
    await interactionsPage.expectTab("Interactions");
  });

  test("Graph subtab renders a canvas", async ({ page }) => {
    const interactionsPage = await setupInteractionsPage(page);

    await interactionsPage.switchToGraph();
    await interactionsPage.expectCanvasVisible();
  });

  test("Graph subtab shows an empty state when there are no interactions", async ({ page }) => {
    const interactionsPage = await setupInteractionsPage(page, []);

    await interactionsPage.switchToGraph();
    await interactionsPage.expectEmptyGraphState();
  });
});
