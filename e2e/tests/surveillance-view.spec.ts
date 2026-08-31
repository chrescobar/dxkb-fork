import { permissiveBackendOverrides } from "../fixtures/overrides";
import { applyBackendMocks, expect, test } from "../mocks/backends";
import { SurveillancePage } from "../pages";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Surveillance view", () => {
  test.beforeEach(async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...permissiveBackendOverrides],
    });
  });

  test("searches the collection, filters locally, and opens the compound member", async ({
    page,
  }) => {
    const keywordRequest = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return (
        url.pathname === "/api/data/surveillance" &&
        url.searchParams.get("keyword") === "sentinel"
      );
    });
    const surveillancePage = new SurveillancePage(page);
    await surveillancePage.searchFromWelcome("sentinel");
    await keywordRequest;

    await surveillancePage.expectCollection("sentinel");
    await surveillancePage.expectMemberVisible("sample/1");

    const collectionRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.includes("/data/surveillance")) {
        collectionRequests.push(request.url());
      }
    });
    await surveillancePage.filterCollection("Nasal swab");
    await page.waitForTimeout(400);
    await surveillancePage.expectMemberVisible("sample/1");
    await surveillancePage.expectCollectionUrl("sentinel");
    expect(collectionRequests).toEqual([]);

    await surveillancePage.filterCollection("not in returned rows");
    await surveillancePage.expectMemberAbsent("sample/1");
    await surveillancePage.expectNoResults();
    await page.waitForTimeout(400);
    expect(collectionRequests).toEqual([]);

    await surveillancePage.clearCollectionFilter();
    await surveillancePage.expectMemberVisible("sample/1");

    const facetRequest = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return (
        url.pathname === "/api/data/surveillance" &&
        url.searchParams.get("keyword") === "sentinel"
      );
    });
    await surveillancePage.selectFacet("RAT/antigen (1)");
    await facetRequest;
    await expect(page).toHaveURL(
      /\/surveillance\?keyword=sentinel&pathogen_test_type=RAT%2Fantigen$/,
    );

    await surveillancePage.openMember("sample/1", "RAT/antigen");
    await surveillancePage.expectOverview();
  });

  test("offers encoded test-type choices for an ambiguous sample", async ({
    page,
  }) => {
    const surveillancePage = new SurveillancePage(page);
    await page.goto("/surveillance/ambiguous-sample");
    await surveillancePage.expectAmbiguityChoices("PCR", "RAT/antigen");
    await expect(
      page.getByRole("link", { name: "RAT/antigen" }),
    ).toHaveAttribute(
      "href",
      "/surveillance/ambiguous-sample?pathogen_test_type=RAT%2Fantigen",
    );
  });
});
