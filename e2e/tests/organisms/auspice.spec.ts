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

// Enough cards to overflow a desktop viewport, so the filter sidebar can be
// checked against a genuinely scrolled tree grid.
const scrollFamily = {
  order: ["h3n2"],
  groups: [
    {
      key: "h3n2",
      title: "H3N2",
      archaeopteryx: Array.from({ length: 24 }, (_, index) => {
        const n = String(index + 1);
        return { name: `Filler tree ${n}`, path: `/test/filler-${n}.xml` };
      }),
      nextstrain: [],
    },
  ],
};

async function mockAuspice(
  page: Parameters<typeof applyBackendMocks>[0],
  inventoryStatus = 200,
  familyBody: typeof family | typeof scrollFamily = family,
) {
  await applyBackendMocks(page, {
    overrides: [
      ...authSessionOverrides,
      workspaceRpcOverride("Workspace.get", { result: [[]] }),
      { url: familyUrl, body: familyBody },
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

test("nav bar logo and wordmark open the Auspice docs in a new tab", async ({ page, context }) => {
  // Stock Auspice hardcodes href="/" with no target on both (it assumes it owns
  // the site root), so a click navigates the iframe to the DXKB home page and
  // renders it nested inside the phylogeny panel. auspice/navbar.js replaces
  // that nav bar; this guards the extension staying wired up in the bundle.
  await mockAuspice(page);
  await openPicker(page);
  await page.getByRole("radio", { name: "Auspice" }).click();
  await card(page, "H3N2 segment 4 (HA)").click();

  const frameSelector = 'iframe[title="Auspice phylogeny viewer for H3N2 segment 4 (HA)"]';
  const viewer = page.frameLocator(frameSelector);
  await expect(viewer.getByText("Deterministic H3N2 Auspice tree", { exact: true })).toBeVisible({ timeout: 30_000 });

  const docsUrl = "https://docs.nextstrain.org/projects/auspice/";
  const wordmark = viewer.getByRole("link", { name: "auspice", exact: true });
  const logo = viewer.getByRole("link", { name: "Auspice documentation" });
  for (const link of [wordmark, logo]) {
    await expect(link).toHaveAttribute("href", docsUrl);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
  }

  // The regression is the iframe navigating away, so assert on where it ends up
  // rather than trusting the attributes alone.
  const popup = await Promise.all([
    context.waitForEvent("page"),
    wordmark.click(),
  ]).then(([opened]) => opened);
  expect(popup.url()).toContain("docs.nextstrain.org");
  await popup.close();

  await expect(page.locator(frameSelector)).toHaveAttribute(
    "src",
    `/nextstrain-viewer/${datasetId}`,
  );
  await expect(viewer.getByText("Deterministic H3N2 Auspice tree", { exact: true })).toBeVisible();
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

test("disables filter options with no matching trees", async ({ page }) => {
  await mockAuspice(page);
  await openPicker(page);

  // Base UI radios/checkboxes are spans with aria-disabled, not native inputs.
  const auspice = page.getByRole("radio", { name: /Auspice/ });
  await expect(auspice).not.toHaveAttribute("aria-disabled", "true");

  // H5N1 in this fixture is Archaeopteryx-only, HA-only.
  await page.getByRole("radio", { name: /H5N1/ }).click();
  await expect(auspice).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByRole("radio", { name: /Archaeopteryx/ })).not.toHaveAttribute("aria-disabled", "true");
  await expect(page.getByRole("checkbox", { name: /^HA/ })).not.toHaveAttribute("aria-disabled", "true");
  await expect(page.getByRole("checkbox", { name: /^NA/ })).toHaveAttribute("aria-disabled", "true");

  // Disabled means inert, not just dimmed: Playwright's actionability check
  // refuses to click a control it considers disabled.
  await expect(auspice.click({ timeout: 2_000 })).rejects.toThrow(/not enabled/);
  await expect(auspice).toHaveAttribute("aria-checked", "false");
  await expect(page.getByText("H5N1 segment 4 (HA)")).toBeVisible();

  // ...and it must also *look* disabled. Base UI renders a span with
  // aria-disabled rather than a natively disabled control, so a `peer-disabled:`
  // style silently never applies — only computed style catches that.
  const rowOpacity = (name: RegExp) =>
    page.getByRole("radio", { name }).locator("xpath=ancestor::label[1]")
      .evaluate(element => Number(getComputedStyle(element).opacity));
  expect(await rowOpacity(/Auspice/)).toBeLessThan(1);
  expect(await rowOpacity(/Archaeopteryx/)).toBe(1);

  // Options are disabled, never removed: the segment list must not reflow.
  const segmentLabels = page.getByRole("checkbox").locator("xpath=ancestor::label[1]");
  const narrowed = await segmentLabels.count();
  await page.getByRole("radio", { name: /All strains/ }).click();
  expect(await segmentLabels.count()).toBe(narrowed);

  // Clearing the strain re-enables everything.
  await expect(auspice).not.toHaveAttribute("aria-disabled", "true");
  await expect(page.getByRole("checkbox", { name: /^NA/ })).not.toHaveAttribute("aria-disabled", "true");
});

test("keeps the filter sidebar pinned while the tree grid scrolls", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "geometry checks run in Chromium");
  await page.setViewportSize({ width: 1440, height: 800 });
  await mockAuspice(page, 200, scrollFamily);
  await openPicker(page);

  const filters = page.getByRole("button", { name: /Filters/ });
  const grid = page.locator("main main:has([data-slot=card])");
  await expect(filters).toBeVisible();

  const before = await filters.boundingBox();
  const scrolled = await grid.evaluate(element => {
    element.scrollTop = element.scrollHeight;
    return { scrollTop: element.scrollTop, scrollHeight: element.scrollHeight };
  });
  // Guards the fixture staying tall enough for the scroll to prove anything.
  expect(scrolled.scrollTop).toBeGreaterThan(0);
  const after = await filters.boundingBox();

  expect(after?.y).toBeCloseTo(before?.y ?? -1, 0);
  await expect(filters).toBeInViewport();
  // The page itself must not scroll — otherwise the sidebar leaves with it.
  const pageScroll = await page.evaluate(() => ({
    scrollY: window.scrollY,
    overflow: document.documentElement.scrollHeight - document.documentElement.clientHeight,
  }));
  expect(pageScroll.scrollY).toBe(0);
  expect(pageScroll.overflow).toBeLessThanOrEqual(1);
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
