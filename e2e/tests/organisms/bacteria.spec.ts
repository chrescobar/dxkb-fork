import { test, expect, applyBackendMocks } from "../../mocks/backends";
import { permissiveBackendOverrides, workspaceOverrides } from "../../fixtures/overrides";
import { OrganismLandingPage } from "../../pages/OrganismLandingPage";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("bacteria organism landing page", () => {
  test.beforeEach(async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...workspaceOverrides, ...permissiveBackendOverrides],
    });
  });

  test("renders the real-data overview panels and stub views", async ({ page }) => {
    const landing = new OrganismLandingPage(page);

    await landing.goto("bacteria");

    await expect(page.getByRole("heading", { level: 1, name: "Bacteria" })).toBeVisible();
    await expect(landing.getKpi("Genomes")).toContainText("1,337,420");
    await expect(landing.getGenusCard("Escherichia")).toContainText("128,450 genomes");
    await expect(page.getByRole("link", { name: /BEI Resources/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Comparative genomics/ })).toBeVisible();
    await landing.expectDonut("Genus");
    await landing.expectDonut("Host");
    await landing.expectDonut("Isolation Country");

    await page.getByRole("button", { name: /Phylogeny/ }).click();
    await expect(page).toHaveURL(/view=phylogeny/);
    await expect(page.getByText("Phylogeny data and visualization")).toBeVisible();

    await page.getByRole("button", { name: /Genomes/ }).click();
    await expect(page).toHaveURL(/view=genomes/);
    await expect(page.getByText("Genome table filtering and pagination")).toBeVisible();
  });

  test("matches the chromium visual snapshot", async ({ page }) => {
    const landing = new OrganismLandingPage(page);

    await landing.goto("bacteria");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("bacteria-organism-landing.png", {
      fullPage: true,
      timeout: 15_000,
    });
  });
});
