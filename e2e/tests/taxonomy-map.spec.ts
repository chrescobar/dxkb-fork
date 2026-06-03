import { test, expect, applyBackendMocks } from "../mocks/backends";
import { permissiveBackendOverrides, workspaceOverrides } from "../fixtures/overrides";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("taxonomy geographic distribution map", () => {
  test.beforeEach(async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...workspaceOverrides, ...permissiveBackendOverrides],
    });
  });

  test("renders the US choropleth, drills into a state, and lazy-loads the world view", async ({ page }) => {
    await page.goto("/taxonomy/234");

    // Section heading and toolbar are visible
    const mapSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { level: 2, name: "Geographic Distribution" }) });
    await expect(mapSection.getByRole("heading", { level: 2, name: "Geographic Distribution" })).toBeVisible();
    await expect(mapSection.getByRole("button", { name: "World" })).toBeVisible();
    await expect(mapSection.getByRole("button", { name: "United States" })).toBeVisible();

    // The map SVG renders with state paths
    const svg = mapSection.getByRole("img", { name: "Genome distribution map" });
    await expect(svg).toBeVisible();
    const statePaths = svg.locator("path");
    await expect(statePaths.first()).toBeAttached();
    await expect(statePaths).toHaveCount(56, { timeout: 10_000 });

    // Drill into Wyoming via the dropdown (most resilient to TopoJSON path ordering)
    await mapSection.getByRole("combobox").click();
    await page.getByRole("option", { name: "Wyoming" }).click();

    // The drill-down pill appears (exit button is its distinguishing element)
    const exitButton = mapSection.getByRole("button", { name: /Exit Wyoming/ });
    await expect(exitButton).toBeVisible();
    await expect(svg.locator("path")).not.toHaveCount(56);

    // Exit drill-down via the pill's X button
    await exitButton.click();
    await expect(svg.locator("path")).toHaveCount(56);

    // Switch to the World view — triggers lazy-load of countries-110m.json
    await mapSection.getByRole("button", { name: "World" }).click();
    await page.waitForResponse((response) => response.url().endsWith("/maps/countries-110m.json"));
    // World choropleth has many country paths
    await expect(svg.locator("path").first()).toBeAttached();
    const worldPathCount = await svg.locator("path").count();
    expect(worldPathCount).toBeGreaterThan(100);
  });
});
