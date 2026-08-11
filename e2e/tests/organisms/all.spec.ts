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

  test("renders the curated overview and composite shared views", async ({ page }) => {
    const landing = new OrganismLandingPage(page);

    await landing.goto("all");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { level: 1, name: "All Organisms" })).toBeVisible();
    await expect(page.getByRole("contentinfo")).toHaveCount(0);
    await expect(landing.getKpi("Genomes")).toContainText("9,800,000");
    await expect(page.getByRole("heading", { name: "Featured Organisms" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "The Three Domains" })).toBeVisible();
    await landing.expectDonut("Host Group");
    await landing.expectDonut("Isolation Country");

    await expect(page.getByRole("button", { name: /Phylogeny/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Interactions/ })).toHaveCount(0);

    await page.getByRole("button", { name: /Taxa Tree/ }).click();
    await expect(page).toHaveURL(/\/organisms\/all\?tab=taxa-tree/);
    await expect(page.getByRole("table")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "cellular organisms" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Viruses" })).toBeVisible();

    await page.getByRole("button", { name: /Genomes/ }).click();
    await expect(page).toHaveURL(/\/organisms\/all\?tab=genomes/);
    await expect(page.getByText("This view is coming soon")).toHaveCount(0);

    await page.goto("/organisms/all?tab=unknown");
    await expect(page).toHaveURL(/\/organisms\/all$/);
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
