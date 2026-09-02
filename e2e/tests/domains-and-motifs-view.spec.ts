import { permissiveBackendOverrides } from "../fixtures/overrides";
import { applyBackendMocks, expect, test } from "../mocks/backends";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Domains and Motifs view", () => {
  test("renders the list-only collection with canonical links and no Deprecated scope", async ({
    page,
  }) => {
    await applyBackendMocks(page, {
      overrides: [...permissiveBackendOverrides],
    });
    const collectionRequest = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return (
        url.pathname === "/api/data/protein_feature" &&
        url.searchParams.get("operation") === "collection"
      );
    });

    await page.goto("/domains-and-motifs?genome_id=1282460.2049");

    const request = await collectionRequest;
    expect(request.url()).toContain("eq%28genome_id%2C1282460.2049%29");
    expect(request.url()).not.toContain("Deprecated");
    await expect(page.getByText("replicase polyprotein")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "fig|1282460.2049.peg.1" }),
    ).toHaveAttribute("href", "/feature/fig%7C1282460.2049.peg.1");
    await expect(
      page.getByRole("button", { name: "Show filters" }),
    ).toBeVisible();
  });

  test("redirects both legacy list aliases", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...permissiveBackendOverrides],
    });

    await page.goto("/view/DomainsAndMotifsList/?genome_id=1282460.2049");
    await expect(page).toHaveURL(
      /\/domains-and-motifs\?genome_id=1282460\.2049$/,
    );

    await page.goto("/view/ProteinFeaturesList/?feature_id=PATRIC.1");
    await expect(page).toHaveURL(/\/domains-and-motifs\?feature_id=PATRIC\.1$/);
  });
});
