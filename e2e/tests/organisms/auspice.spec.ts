import { authSessionOverrides } from "../../fixtures/overrides/auth-session";
import { workspaceRpcOverride } from "../../fixtures/overrides/workspace";
import dataset from "../../fixtures/overrides/organisms/phylogeny/auspice-tree-map-v2.json" with { type: "json" };
import { applyBackendMocks, expect, test } from "../../mocks/backends";

const familyUrl = /\/api\/content\/phyloxml_trees\/families\/2955291\/2955291\.json$/;
const datasetId = "Influenza-A-Virus/H3N2/HA";
const family = {
  order: ["h3n2", "h5n1"],
  groups: [
    {
      key: "h3n2",
      title: "H3N2",
      archaeopteryx: [{ name: "XML HA", path: "/test/h3n2-ha.xml" }],
      nextstrain: [
        { name: "H3N2 segment 4 (HA)", path: datasetId, region: "usa" },
        { name: "H3N2 segment 6 (NA)", path: "Influenza-A-Virus/H3N2/NA" },
      ],
    },
    {
      key: "h5n1",
      title: "H5N1",
      archaeopteryx: [{ name: "H5N1 segment 4 (HA)", path: "/test/h5n1-ha.xml" }],
      nextstrain: [],
    },
  ],
};

async function mockAuspice(page: Parameters<typeof applyBackendMocks>[0], inventoryStatus = 200) {
  await applyBackendMocks(page, {
    overrides: [
      ...authSessionOverrides,
      workspaceRpcOverride("Workspace.get", { result: [[]] }),
      { url: familyUrl, body: family },
      {
        url: "/api/phylogeny/nextstrain-datasets",
        status: inventoryStatus,
        body: inventoryStatus === 200 ? { ids: [datasetId] } : { error: "unavailable" },
      },
      { url: "/api/charon/getAvailable", body: { datasets: [], narratives: [] } },
      {
        url: /\/api\/charon\/getDataset\?.*type=(root-sequence|tip-frequencies|measurements)/,
        status: 404,
        body: { error: "dataset not found" },
      },
      {
        url: "/api/charon/getDataset",
        body: dataset,
      },
    ],
  });
  await page.route(/https:\/\/[a-d]\.basemaps\.cartocdn\.com\/.+\.png/, route =>
    route.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+X2NDNwAAAABJRU5ErkJggg==",
        "base64",
      ),
    })
  );
}

async function openPicker(page: Parameters<typeof applyBackendMocks>[0]) {
  await page.goto("/taxonomy/2955291?tab=phylogeny");
  const heading = page.getByRole("heading", { name: "Available phylogenetic trees" });
  if (!(await heading.isVisible())) {
    if ((page.viewportSize()?.width ?? 1280) < 768) {
      await page.getByRole("button", { name: /Views: Phylogeny/ }).click();
      await page
        .getByRole("dialog", { name: "Views" })
        .getByRole("button", { name: "Phylogeny" })
        .click();
    } else {
      await page.getByRole("button", { name: "Phylogeny" }).click();
    }
  }
  await expect(
    page.getByRole("heading", { name: "Available phylogenetic trees" }),
  ).toBeVisible();
}

function card(page: Parameters<typeof applyBackendMocks>[0], name: string) {
  return page.getByText(name, { exact: true }).locator("xpath=ancestor::*[@data-slot='card']");
}

test.use({ storageState: { cookies: [], origins: [] } });
test.setTimeout(90_000);

test("opens the exact Auspice dataset and renders tree, map, and attribution", async ({ page }) => {
  await mockAuspice(page);
  const datasetRequests: string[] = [];
  page.on("request", request => {
    const url = new URL(request.url());
    if (url.pathname === "/api/charon/getDataset" && !url.searchParams.has("type")) {
      datasetRequests.push(url.searchParams.get("prefix") ?? "");
    }
  });

  await openPicker(page);
  await page.getByRole("radio", { name: "Auspice" }).click();
  const available = card(page, "H3N2 segment 4 (HA)");
  const missing = card(page, "H3N2 segment 6 (NA)");
  await expect(available).not.toHaveAttribute("aria-disabled", "true");
  await expect(missing).toHaveAttribute("aria-disabled", "true");
  await expect(missing).toHaveAttribute("tabindex", "-1");
  await available.click();

  const iframe = page.getByTitle("Auspice phylogeny viewer for H3N2 segment 4 (HA)");
  await expect(iframe).toHaveAttribute(
    "src",
    "/nextstrain-viewer/Influenza-A-Virus/H3N2/HA",
  );
  const viewer = page.frameLocator('iframe[title="Auspice phylogeny viewer for H3N2 segment 4 (HA)"]');
  await expect(viewer.getByText("Deterministic H3N2 Auspice tree", { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(viewer.getByText("E2E-USA", { exact: true })).toBeVisible();
  await expect(viewer.locator("#map")).toBeVisible();
  await expect(viewer.getByText(/Powered by Nextstrain/)).toBeVisible();
  expect(datasetRequests).toEqual([`nextstrain-viewer/${datasetId}`]);

  await page.getByRole("button", { name: /Back to trees/ }).click();
  await expect(iframe).toHaveCount(0);
  await expect(available).toBeFocused();
});

test("fails closed when inventory is unavailable", async ({ page }) => {
  await mockAuspice(page, 500);
  await openPicker(page);

  await expect(card(page, "H3N2 segment 4 (HA)")).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(card(page, "XML HA")).not.toHaveAttribute("aria-disabled", "true");
});

test("supports keyboard activation and mobile containment", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "detailed keyboard and geometry checks run in Chromium");
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAuspice(page);
  await openPicker(page);
  await page.getByRole("radio", { name: "Auspice" }).click();

  const available = card(page, "H3N2 segment 4 (HA)");
  await available.focus();
  await page.keyboard.press("Enter");
  const iframe = page.getByTitle("Auspice phylogeny viewer for H3N2 segment 4 (HA)");
  await expect(iframe).toBeVisible();
  const geometry = await iframe.evaluate(element => {
    const frame = element.getBoundingClientRect();
    const root = document.documentElement;
    return {
      height: frame.height,
      right: frame.right,
      viewportWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
    };
  });
  expect(geometry.height).toBeGreaterThanOrEqual(600);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);

  await page.getByRole("button", { name: /Back to trees/ }).click();
  await expect(available).toBeFocused();
  await page.keyboard.press("Space");
  await expect(iframe).toBeVisible();
});
