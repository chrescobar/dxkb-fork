import { readFile } from "node:fs/promises";

import { type Locator, type Page } from "@playwright/test";

import { applyBackendMocks, expect, test } from "../../mocks/backends";

const treeXml = `<?xml version="1.0" encoding="UTF-8"?>
<phyloxml xmlns="http://www.phyloxml.org">
  <phylogeny rooted="true">
    <name>Regression tree</name>
    <clade>
      <name>Root</name>
      <confidence type="bootstrap">100</confidence>
      <clade>
        <name>Leaf A</name>
        <branch_length>0.1</branch_length>
        <property ref="dxkb:genome_name" datatype="xsd:string" applies_to="node">Genome A</property>
        <property ref="dxkb:host_common_name" datatype="xsd:string" applies_to="node">Human</property>
        <property ref="dxkb:in-group" datatype="xsd:string" applies_to="node">Yes</property>
      </clade>
      <clade>
        <name>Leaf B</name>
        <branch_length>0.2</branch_length>
        <property ref="dxkb:genome_name" datatype="xsd:string" applies_to="node">Genome B</property>
        <property ref="dxkb:host_common_name" datatype="xsd:string" applies_to="node">Animal</property>
        <property ref="dxkb:in-group" datatype="xsd:string" applies_to="node">No</property>
      </clade>
    </clade>
  </phylogeny>
</phyloxml>`;

const box = async (locator: Locator) => {
  const value = await locator.boundingBox();
  if (!value)
    throw new Error(`Expected ${locator.toString()} to have a bounding box`);
  return value;
};

const closeTo = (actual: number, expected: number, tolerance = 1) => {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
};

async function openPhylogeny(page: Page) {
  await applyBackendMocks(page);
  await page.route(
    /\/api\/content\/bvbrc_phylogeny_tab\/taxon_tree_dict\.json$/,
    (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ 234: "regression.xml" }),
      }),
  );
  await page.route(
    /\/api\/content\/bvbrc_phylogeny_tab\/phyloxml\/regression\.xml$/,
    (route) => route.fulfill({ contentType: "application/xml", body: treeXml }),
  );

  const dictionaryResponse = page.waitForResponse(/taxon_tree_dict\.json$/);
  const treeResponse = page.waitForResponse(/phyloxml\/regression\.xml$/);
  await page.goto("/taxonomy/234?tab=phylogeny");
  await dictionaryResponse;
  await treeResponse;
  await expect(page.getByText("Display Data", { exact: true })).toBeVisible({
    timeout: 30_000,
  });
}

test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 1280, height: 900 },
});
test.setTimeout(60_000);

test.describe("Archaeopteryx phylogeny controls", () => {
  test.describe.configure({ mode: "serial" });
  test("uses the active dark theme for the canvas and labels", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("theme", "dxkb-dark");
    });
    await openPhylogeny(page);

    const svg = page.locator('[role="img"] svg');
    const defaultLabelColors = await svg
      .locator("text")
      .evaluateAll((labels) =>
        labels
          .filter((element) => element.textContent.trim() !== "")
          .map((element) => getComputedStyle(element).fill),
      );
    await page.locator("#lcs_menu").selectOption("genome_name");
    await page.locator("#nfcolors_menu").selectOption("host_common_name");
    await expect(
      svg.locator("text.legendDescription").filter({
        hasText: "host_common_name",
      }),
    ).toHaveText("host_common_name");

    const colors = await svg.evaluate((svg) => {
      const background =
        svg.querySelector<SVGRectElement>('rect[width="100%"]');
      const legendLabels = Array.from(
        svg.querySelectorAll(
          "text.legend, text.legendLabel, text.legendDescription",
        ),
      )
        .filter((element) => element.textContent.trim() !== "")
        .map((element) => ({
          text: element.textContent,
          fill: getComputedStyle(element).fill,
        }));
      const branch = svg.querySelector("path");
      const foregroundProbe = document.createElement("div");
      foregroundProbe.style.color = "var(--foreground)";
      document.body.append(foregroundProbe);
      const foreground = getComputedStyle(foregroundProbe).color;
      foregroundProbe.remove();
      return {
        background: background ? getComputedStyle(background).fill : null,
        foreground,
        legendLabels,
        branch: branch ? getComputedStyle(branch).stroke : null,
      };
    });

    expect(colors.background).not.toBe("rgb(255, 255, 255)");
    expect(new Set(defaultLabelColors)).toEqual(new Set([colors.foreground]));
    expect(colors.legendLabels).toEqual(
      expect.arrayContaining(
        ["Label Color", "genome_name", "Node Fill", "host_common_name"].map(
          (text) => ({
            text,
            fill: colors.foreground,
          }),
        ),
      ),
    );
    expect(colors.legendLabels.length).toBeGreaterThan(4);
    expect(new Set(colors.legendLabels.map(({ fill }) => fill))).toEqual(
      new Set([colors.foreground]),
    );
    expect(colors.branch).toBe("rgb(115, 115, 115)");
  });

  test("updates theme colors without rebuilding the tree", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("theme", "dxkb-light");
    });
    await openPhylogeny(page);

    const svg = page.locator('[role="img"] svg');
    const initialBackground = await svg
      .locator(".basebackground")
      .evaluate((element) => getComputedStyle(element).fill);
    await svg.evaluate((element) => {
      element.dataset.themeIdentity = "preserve";
    });

    await page.evaluate(() => {
      document.documentElement.dataset.theme = "dxkb-dark";
    });

    await expect(svg).toHaveAttribute("data-theme-identity", "preserve");
    await expect
      .poll(() =>
        svg
          .locator(".basebackground")
          .evaluate((element) => getComputedStyle(element).fill),
      )
      .not.toBe(initialBackground);
    await expect(
      page.locator(".archaeopteryx-dxkb > .absolute.inset-0"),
    ).toHaveCount(0);
  });

  test("renders readable, consistently sized controls without overflow", async ({
    page,
  }) => {
    await openPhylogeny(page);

    const displayData = page.locator("fieldset", {
      has: page.getByText("Display Data", { exact: true }),
    });
    const displayLabels = await displayData.locator("label").allTextContents();
    expect(displayLabels).toEqual(
      expect.arrayContaining([
        "Node Name",
        "Genome Name",
        "Host Common Name",
        "In Group",
      ]),
    );
    expect(
      displayLabels.some(
        (label) =>
          label.includes("_") ||
          label !==
            label.replace(/\b\w/g, (character) => character.toUpperCase()),
      ),
    ).toBe(false);

    const primary = page.locator('[id$="-controls-primary"]');
    const pacHeight = (await box(page.locator('label[for="phy_b"]'))).height;
    for (const id of [
      "zoomout_y",
      "ord_b",
      "sf0",
      "reset_s_a",
      "depth_col_label",
      "incr_dcl",
      "dl_b",
      "exp_f_sel",
    ]) {
      closeTo((await box(page.locator(`#${id}`))).height, pacHeight, 2);
    }

    await expect(page.locator("#depth_col_label")).not.toHaveValue("");
    const labelSizeHandles = await Promise.all(
      ["entfs_sl", "intfs_sl", "bdfs_sl"].map((id) =>
        box(page.locator(`#${id} .ui-slider-handle`)),
      ),
    );
    for (const handle of labelSizeHandles.slice(1)) {
      closeTo(handle.x, labelSizeHandles[0].x);
    }
    const downloadFormat = page.locator("#exp_f_sel");
    await expect(downloadFormat.locator("option")).toHaveText([
      "PNG",
      "SVG",
      "phyloXML",
      "Newick",
      "Fasta",
    ]);
    const downloadSpacing = await downloadFormat.evaluate((element) => {
      const select = element as HTMLSelectElement;
      return {
        select: getComputedStyle(select).paddingLeft,
        options: Array.from(
          select.options,
          (option) => getComputedStyle(option).paddingLeft,
        ),
      };
    });
    expect(downloadSpacing.select).not.toBe("0px");
    expect(new Set(downloadSpacing.options)).toEqual(
      new Set([downloadSpacing.select]),
    );

    const search = await box(page.locator("#sf0"));
    const searchReset = await box(page.locator("#reset_s_a"));
    closeTo(searchReset.x - (search.x + search.width), 2);

    const zoomButtons = await Promise.all(
      ["zoomout_x", "zoomtofit", "zoomtoexpandy", "zoomin_x"].map((id) =>
        box(page.locator(`#${id}`)),
      ),
    );
    for (let index = 1; index < zoomButtons.length; index += 1) {
      closeTo(
        zoomButtons[index].x -
          (zoomButtons[index - 1].x + zoomButtons[index - 1].width),
        2,
      );
    }

    const legendField = page.locator("fieldset", {
      has: page.getByText("Vis Legend", { exact: true }),
    });
    const legendBox = await box(legendField);
    for (const id of ["legends_mup", "legends_mdown"]) {
      closeTo((await box(page.locator(`#${id}`))).width, legendBox.width);
    }
    const thirds = await Promise.all(
      ["legends_mleft", "legends_rest", "legends_mright"].map((id) =>
        box(page.locator(`#${id}`)),
      ),
    );
    closeTo(
      thirds.reduce((width, item) => width + item.width, 0) + 4,
      legendBox.width,
    );

    const disabledLegendButton = page.locator("#legends_mup");
    await expect(disabledLegendButton).toBeDisabled();
    const [legendBackground, regularBackground] = await Promise.all([
      disabledLegendButton.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
      page
        .locator("#ord_b")
        .evaluate((element) => getComputedStyle(element).backgroundColor),
    ]);
    expect(legendBackground).toBe(regularBackground);

    const primaryDimensions = await primary.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(primaryDimensions.scrollWidth).toBe(primaryDimensions.clientWidth);
  });

  test("only highlights selected display data options", async ({ page }) => {
    await openPhylogeny(page);

    const displayData = page.locator("fieldset", {
      has: page.getByText("Display Data", { exact: true }),
    });
    const selected = displayData.getByText("Node Name", { exact: true });
    const option = displayData.getByText("Genome Name", { exact: true });
    const checkbox = displayData.getByRole("checkbox", {
      name: "Genome Name",
    });

    await option.click();
    await expect(checkbox).toBeChecked();
    await option.click();
    await expect(checkbox).not.toBeChecked();

    const [selectedBackground, optionBackground] = await Promise.all([
      selected.evaluate((element) => getComputedStyle(element).backgroundColor),
      option.evaluate((element) => getComputedStyle(element).backgroundColor),
    ]);
    expect(optionBackground).not.toBe(selectedBackground);
  });

  test("downloads the tree as a PNG", async ({ page }) => {
    await openPhylogeny(page);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download", exact: true }).click();
    const download = await downloadPromise;
    const path = await download.path();

    expect(download.suggestedFilename()).toMatch(/\.png$/);
    expect(path).not.toBeNull();
    if (!path) throw new Error("Expected the PNG download to have a path");
    const bytes = await readFile(path);
    expect([...bytes.subarray(0, 8)]).toEqual([
      137, 80, 78, 71, 13, 10, 26, 10,
    ]);
  });

  test("keeps the canvas and visualization controls inside the tree viewport while resizing", async ({
    page,
  }) => {
    await openPhylogeny(page);

    const treeViewport = page.locator(".archaeopteryx-dxkb");
    const treeHost = treeViewport.locator('div[role="img"]');
    const svg = treeHost.locator("svg");
    const visualControls = page.locator('[id$="-controls-secondary"]');

    const expectFitted = async () => {
      const viewportBox = await box(treeViewport);
      const hostBox = await box(treeHost);
      const svgBox = await box(svg);
      const primaryControlsBox = await box(
        page.locator('[id$="-controls-primary"]'),
      );
      const controlsBox = await box(visualControls);
      closeTo(hostBox.height, viewportBox.height);
      closeTo(svgBox.height, viewportBox.height);
      const legend = svg.getByText("Label Color", { exact: true });
      const getGraphBox = () =>
        svg.locator(".node text, .link").evaluateAll((elements) => {
          const bounds = elements
            .filter((element) => {
              const style = getComputedStyle(element);
              return (
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                Number(style.opacity) > 0 &&
                Number(style.fillOpacity) > 0 &&
                Number(style.strokeOpacity) > 0
              );
            })
            .map((element) => element.getBoundingClientRect())
            .filter((bounds) => bounds.width > 0 || bounds.height > 0);
          if (bounds.length === 0) {
            throw new Error("Expected visible graph geometry");
          }
          return {
            left: Math.min(...bounds.map((item) => item.left)),
            right: Math.max(...bounds.map((item) => item.right)),
          };
        });
      expect(hostBox.width).toBeLessThan(viewportBox.width);
      closeTo(controlsBox.x, hostBox.x + hostBox.width);
      closeTo(svgBox.width, hostBox.width - 14);
      if (await legend.count()) {
        expect((await box(legend)).x).toBeGreaterThanOrEqual(
          primaryControlsBox.x + primaryControlsBox.width,
        );
      }
      await expect
        .poll(async () => (await getGraphBox()).left)
        .toBeGreaterThanOrEqual(
          primaryControlsBox.x + primaryControlsBox.width - 1,
        );
      await expect
        .poll(async () => (await getGraphBox()).right)
        .toBeLessThanOrEqual(controlsBox.x);
      closeTo(
        viewportBox.x + viewportBox.width - (controlsBox.x + controlsBox.width),
        12,
      );
      expect(controlsBox.x + controlsBox.width).toBeLessThanOrEqual(
        viewportBox.x + viewportBox.width,
      );
      return viewportBox.width;
    };

    const closedWidth = await expectFitted();
    await svg
      .locator("g.node", { hasText: "Leaf A" })
      .locator("circle.nodeCircleOptions")
      .click({ force: true });
    await svg
      .getByText("Select/Deselect Node", { exact: true })
      .dispatchEvent("click");
    await expect(page.getByRole("heading", { name: "Leaf A" })).toBeVisible();
    await expect(
      page
        .getByRole("button", { name: "Hide" })
        .filter({ has: page.locator("svg") }),
    ).toBeVisible();
    await expect
      .poll(async () => (await box(treeViewport)).width)
      .toBeLessThan(closedWidth);
    const openWidth = await expectFitted();

    const separator = page.getByRole("separator");
    const separatorBox = await box(separator);
    await page.mouse.move(
      separatorBox.x,
      separatorBox.y + separatorBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      separatorBox.x - 100,
      separatorBox.y + separatorBox.height / 2,
      { steps: 5 },
    );
    await page.mouse.up();
    await expect
      .poll(async () => (await box(treeViewport)).width)
      .toBeLessThan(openWidth);
    await expectFitted();

    await page
      .getByRole("button", { name: "Hide" })
      .filter({ has: page.locator("svg") })
      .click();
    await expect
      .poll(async () => (await box(treeViewport)).width)
      .toBeGreaterThan(openWidth);
    await expectFitted();
  });
});
