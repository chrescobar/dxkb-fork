import { applyBackendMocks, expect, test } from "../mocks/backends";
import { permissiveBackendOverrides } from "../fixtures/overrides";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Genome view", () => {
  test.beforeEach(async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...permissiveBackendOverrides],
    });
  });

  test("uses the shared rich Genome collection in Taxonomy", async ({
    page,
  }) => {
    await page.goto("/taxonomy/11974?tab=genomes");

    const keyword = page.getByPlaceholder("Search keywords...");
    await expect(keyword).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "Middle East respiratory syndrome-related coronavirus isolate",
      }),
    ).toHaveCount(0);

    await keyword.fill("MERS");
    await expect(page).toHaveURL(
      /\/taxonomy\/11974\?tab=genomes&keyword=MERS$/,
      { timeout: 2_000 },
    );
    await page.getByRole("button", { name: "Show Filters" }).click();
    await page.getByRole("button", { name: "Complete (1)" }).click();
    await expect(page).toHaveURL(
      /\/taxonomy\/11974\?tab=genomes&keyword=MERS&genome_status=Complete$/,
    );

    const row = page.getByRole("row", { name: /Select row 1282460\.2049/ });
    await expect(row).toBeVisible();
    await row.click();
    await expect(
      page.getByRole("button", { name: /^G\s*GENOME$/i }),
    ).toBeEnabled();
    await expect(
      page.getByRole("heading", {
        level: 3,
        name: "Middle East respiratory syndrome-related coronavirus isolate",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "General Info" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Genome Statistics" }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Select all 1 results across all pages" })
      .click();
    await expect(
      page.getByText("All 1 results are selected across all pages."),
    ).toBeVisible();
  });

  test("canonicalizes invalid collection position without rendering an error", async ({
    page,
  }) => {
    await page.goto("/genome?page=0&sort=unknown%3Aasc&keep=yes");

    await expect(page).toHaveURL(/\/genome\?keep=yes$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Genomes" }),
    ).toBeVisible();
  });

  test("searches, inspects, opens, and returns to the same collection", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("combobox", { name: "Search type" }).click();
    await page.getByRole("option", { name: "Genomes" }).click();
    await page
      .getByPlaceholder("Search by virus name, protein, gene, or taxonomy...")
      .fill("MERS");
    await page.getByRole("button", { name: "Search", exact: true }).click();

    await expect(page).toHaveURL(/\/genome\?keyword=MERS$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Genomes" }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("Search keywords...")).toHaveValue(
      "MERS",
    );

    const row = page.getByRole("row", { name: /Select row 1282460\.2049/ });
    await row.click();
    await expect(
      page.getByRole("heading", {
        level: 3,
        name: "Middle East respiratory syndrome-related coronavirus isolate",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Genome Statistics" }),
    ).toBeVisible();

    await page.getByRole("button", { name: /^G\s*GENOME$/i }).click();
    await expect(page).toHaveURL(/\/genome\/1282460\.2049$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Middle East respiratory syndrome-related coronavirus isolate",
      }),
    ).toBeVisible();
    await expect(page.getByText("Assembly summary")).toBeVisible();
    const sequenceRequest = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return (
        url.pathname === "/api/data/genome_sequence" &&
        url.searchParams.get("rql") === "eq(genome_id,1282460.2049)"
      );
    });
    await page.getByRole("button", { name: "Sequences" }).click();
    await sequenceRequest;
    await expect(page).toHaveURL(/\?tab=sequences$/);
    await expect(page.getByText("JX869059")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Genome Browser" }),
    ).toHaveAttribute("aria-disabled", "true");

    await page.goBack();
    await expect(page).toHaveURL(/\/genome\/1282460\.2049$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/genome\?keyword=MERS$/);
    await expect(page.getByPlaceholder("Search keywords...")).toHaveValue(
      "MERS",
    );
  });
});
