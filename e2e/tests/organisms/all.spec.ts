import { test, expect, applyBackendMocks } from "../../mocks/backends";
import { permissiveBackendOverrides, workspaceOverrides } from "../../fixtures/overrides";
import { OrganismLandingPage } from "../../pages/organism-landing-page";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("all organisms landing page", () => {
  test.beforeEach(async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...workspaceOverrides, ...permissiveBackendOverrides],
    });
  });

  test("renders the real-data overview panels and stub views", async ({ page }) => {
    const landing = new OrganismLandingPage(page);

    await landing.goto("all");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { level: 1, name: "All Organisms" })).toBeVisible();
    await expect(landing.getKpi("Genomes")).toContainText("9,800,000");
    await expect(page.getByRole("heading", { name: "Featured Organisms" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "The Three Domains" })).toBeVisible();
    await landing.expectDonut("Host Group");
    await landing.expectDonut("Isolation Country");

    await page.getByRole("button", { name: /Phylogeny/ }).click();
    await expect(page).toHaveURL(/tab=phylogeny/);
    await expect(page.getByText("This view is coming soon")).toBeVisible();

    await page.getByRole("button", { name: /AMR Phenotypes/ }).click();
    await expect(page).toHaveURL(/tab=amr-phenotypes/);
    await expect(page.getByText("This view is coming soon")).toBeVisible();
  });

  test("matches the visual snapshot", async ({ page }) => {
    const landing = new OrganismLandingPage(page);

    await landing.goto("all");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("all-organism-landing.png", {
      fullPage: true,
      timeout: 15_000,
    });
  });
});
