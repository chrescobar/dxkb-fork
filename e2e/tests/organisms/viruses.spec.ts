import { test, expect, applyBackendMocks } from "../../mocks/backends";
import { permissiveBackendOverrides, workspaceOverrides } from "../../fixtures/overrides";
import { OrganismLandingPage } from "../../pages/organism-landing-page";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("viruses organism landing page", () => {
  test.beforeEach(async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...workspaceOverrides, ...permissiveBackendOverrides],
    });
  });

  test("renders the real-data overview panels and stub views", async ({ page }) => {
    const landing = new OrganismLandingPage(page);

    await landing.goto("viruses");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { level: 1, name: "Viruses" })).toBeVisible();
    await expect(landing.getKpi("Genomes")).toContainText("890,123");
    await expect(page.getByRole("heading", { name: "Virus Families" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Featured Viruses" })).toBeVisible();
    await landing.expectDonut("Family");
    await landing.expectDonut("Host Group");
    await landing.expectDonut("Isolation Country");

    await page.getByRole("button", { name: /Taxonomy/ }).click();
    await expect(page).toHaveURL(/tab=taxonomy/);
    await expect(page.getByText("This view is coming soon")).toBeVisible();

    await page.getByRole("button", { name: /Genomes/ }).click();
    await expect(page).toHaveURL(/tab=genomes/);
    await expect(page.getByText("This view is coming soon")).toBeVisible();
  });

  test("matches the visual snapshot", async ({ page }) => {
    const landing = new OrganismLandingPage(page);

    await landing.goto("viruses");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("viruses-organism-landing.png", {
      fullPage: true,
      timeout: 15_000,
    });
  });
});
