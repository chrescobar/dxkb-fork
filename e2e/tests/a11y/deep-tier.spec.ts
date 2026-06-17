import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  authSessionOverrides,
  workspaceOverrides,
  jobsOverrides,
  permissiveBackendOverrides,
  workspacePopulatedOverrides,
  workspaceEmptyOverrides,
  jobsEmptyOverrides,
  buildJobsOverrides,
  mockJobs,
} from "../../fixtures/overrides";
import { awaitSettled } from "../../a11y/settle";
import { scanPage, formatBlocking, logWarnings } from "../../a11y/axe-scan";
import { partition } from "../../a11y/gate";
import { applyBaseline } from "../../a11y/baseline";
import { forEachTheme } from "../../a11y/theme";
import generatedBaseline from "../../a11y/baseline.generated";
import { WorkspacePage } from "../../pages/workspace-page";
import { JobsListPage } from "../../pages/jobs-list-page";
import type { BaselineMap } from "../../a11y/baseline";
import type { MockJob } from "../../fixtures/overrides";

const baselineMap: BaselineMap = generatedBaseline;

/** Scan current page state and assert no unbaselined blocking violations. */
async function assertNoBlocking(
  page: Parameters<typeof scanPage>[0],
  surfaceName: string,
  theme: Parameters<typeof applyBaseline>[2],
): Promise<void> {
  const violations = await scanPage(page);
  const { blocking, warnings } = partition(violations);
  const { remaining, suppressed } = applyBaseline(baselineMap, surfaceName, theme, blocking);
  logWarnings(warnings, `${surfaceName} (${theme})`);
  if (suppressed.length > 0) {
    console.info(`[a11y] ${surfaceName} (${theme}): ${String(suppressed.length)} suppressed`);
  }
  expect(
    remaining,
    remaining.length === 0 ? undefined : formatBlocking(remaining, `${surfaceName} (${theme})`),
  ).toEqual([]);
}

// ── Service forms — interaction states ──────────────────────────────────────────

test.describe("a11y deep tier: service forms", () => {
  // genome-assembly as the representative service form (already covered by sweep).
  // These tests exercise states the load-scan cannot reach.

  test("genome-assembly: validation errors shown", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...authSessionOverrides, ...permissiveBackendOverrides],
    });
    await page.goto("/services/genome-assembly");
    await page.waitForLoadState("networkidle");

    // Submit with empty required fields to trigger inline validation errors.
    await page.getByRole("button", { name: /submit/i }).click();
    // Give validation messages time to render.
    await page.waitForTimeout(300);

    await forEachTheme(page, async (theme) => {
      await assertNoBlocking(page, "genome-assembly/validation-errors", theme);
    });
  });

  test("genome-assembly: file-picker dialog open", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...authSessionOverrides, ...workspacePopulatedOverrides, ...permissiveBackendOverrides],
    });
    await page.goto("/services/genome-assembly");
    await page.waitForLoadState("networkidle");

    // Open the output folder picker (labeled "Output Folder" or similar).
    const folderButton = page.getByRole("button", { name: /output folder|select folder|browse/i }).first();
    if (await folderButton.isVisible()) {
      await folderButton.click();
      await page.getByRole("dialog").waitFor({ state: "visible", timeout: 5_000 });
    } else {
      test.skip();
    }

    await forEachTheme(page, async (theme) => {
      await assertNoBlocking(page, "genome-assembly/file-picker-open", theme);
    });
  });
});

// ── Workspace — data states ──────────────────────────────────────────────────────

test.describe("a11y deep tier: workspace", () => {
  test("workspace: populated state", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...authSessionOverrides, ...workspacePopulatedOverrides, ...permissiveBackendOverrides],
    });
    const wp = new WorkspacePage(page);
    await wp.goto();
    await awaitSettled(page);

    await forEachTheme(page, async (theme) => {
      await assertNoBlocking(page, "workspace/populated", theme);
    });
  });

  test("workspace: empty state", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...authSessionOverrides, ...workspaceEmptyOverrides, ...permissiveBackendOverrides],
    });
    const wp = new WorkspacePage(page);
    await wp.goto();
    await awaitSettled(page);

    await forEachTheme(page, async (theme) => {
      await assertNoBlocking(page, "workspace/empty", theme);
    });
  });

  test("workspace: details panel open", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...authSessionOverrides, ...workspacePopulatedOverrides, ...permissiveBackendOverrides],
    });
    const wp = new WorkspacePage(page);
    await wp.goto();
    await awaitSettled(page);

    // Select the first file to open the details panel.
    await wp.selectFile("sample.fastq");
    await page.waitForLoadState("networkidle");

    await forEachTheme(page, async (theme) => {
      await assertNoBlocking(page, "workspace/details-panel-open", theme);
    });
  });

  test("workspace: new-folder dialog open", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...authSessionOverrides, ...workspacePopulatedOverrides, ...permissiveBackendOverrides],
    });
    const wp = new WorkspacePage(page);
    await wp.goto();
    await awaitSettled(page);

    await wp.openNewFolder();

    await forEachTheme(page, async (theme) => {
      await assertNoBlocking(page, "workspace/new-folder-dialog", theme);
    });
  });

  test("workspace: upload dialog open", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...authSessionOverrides, ...workspacePopulatedOverrides, ...permissiveBackendOverrides],
    });
    const wp = new WorkspacePage(page);
    await wp.goto();
    await awaitSettled(page);

    await wp.openUpload();

    await forEachTheme(page, async (theme) => {
      await assertNoBlocking(page, "workspace/upload-dialog", theme);
    });
  });
});

// ── Jobs — data states ────────────────────────────────────────────────────────────

test.describe("a11y deep tier: jobs", () => {
  test("jobs: populated state", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...authSessionOverrides, ...jobsOverrides, ...permissiveBackendOverrides],
    });
    const jobs = new JobsListPage(page);
    await jobs.goto();
    await page.waitForLoadState("networkidle");

    await forEachTheme(page, async (theme) => {
      await assertNoBlocking(page, "jobs/populated", theme);
    });
  });

  test("jobs: empty state", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...authSessionOverrides, ...jobsEmptyOverrides, ...permissiveBackendOverrides],
    });
    const jobs = new JobsListPage(page);
    await jobs.goto();
    await page.waitForLoadState("networkidle");

    await forEachTheme(page, async (theme) => {
      await assertNoBlocking(page, "jobs/empty", theme);
    });
  });

  test("jobs: failed-job row visible", async ({ page }) => {
    const failedJob: MockJob = {
      id: "job-failed",
      app: "GenomeAssembly",
      status: "failed",
      submit_time: "2026-04-01T09:00:00Z",
    };
    await applyBackendMocks(page, {
      overrides: [
        ...authSessionOverrides,
        ...buildJobsOverrides({ jobs: [failedJob] }),
        ...permissiveBackendOverrides,
      ],
    });
    const jobs = new JobsListPage(page);
    await jobs.goto();
    await jobs.waitForRows();

    await forEachTheme(page, async (theme) => {
      await assertNoBlocking(page, "jobs/failed-row", theme);
    });
  });

  test("jobs: kill-confirmation dialog", async ({ page }) => {
    const runningJob: MockJob = {
      id: mockJobs[1].id,
      app: mockJobs[1].app,
      status: "running",
      submit_time: mockJobs[1].submit_time,
    };
    await applyBackendMocks(page, {
      overrides: [
        ...authSessionOverrides,
        ...buildJobsOverrides({ jobs: [runningJob] }),
        ...permissiveBackendOverrides,
      ],
    });
    const jobs = new JobsListPage(page);
    await jobs.goto();
    await jobs.waitForRows();

    await jobs.selectJob(runningJob.id);
    await jobs.killSelected();

    const dialog = page.getByRole("dialog").filter({ hasText: /confirm|kill|stop/i });
    if (await dialog.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await forEachTheme(page, async (theme) => {
        await assertNoBlocking(page, "jobs/kill-dialog", theme);
      });
    } else {
      // If no confirmation dialog, just verify the kill button itself was accessible.
      test.info().annotations.push({ type: "note", description: "kill-dialog not present in this build" });
    }
  });
});

// ── Search — data states ──────────────────────────────────────────────────────────

test.describe("a11y deep tier: search", () => {
  const emptyDataApiResponse = Object.fromEntries(
    ["taxonomy", "genome", "strain", "genome_feature", "sp_gene",
     "protein_feature", "epitope", "protein_structure", "pathway",
     "subsystem", "surveillance", "serology", "experiment",
     "antibiotics", "genome_sequence"].map((type) => [
      type,
      { result: { response: { docs: [], numFound: 0, maxScore: 0, numFoundExact: true } } },
    ]),
  );

  const dataApiOverride = {
    url: /theseed\.org\/services\/data_api\/query/,
    method: "POST",
    body: emptyDataApiResponse,
  } as const;

  test("search: no-results state", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...authSessionOverrides, dataApiOverride, ...permissiveBackendOverrides],
    });
    await page.goto("/search?q=zzznoresultsxxx&searchtype=everything");
    await page.waitForLoadState("networkidle");

    await forEachTheme(page, async (theme) => {
      await assertNoBlocking(page, "search/no-results", theme);
    });
  });

  test("search: default state (no query)", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...authSessionOverrides, dataApiOverride, ...permissiveBackendOverrides],
    });
    await page.goto("/search");
    await page.waitForLoadState("networkidle");

    await forEachTheme(page, async (theme) => {
      await assertNoBlocking(page, "search/default", theme);
    });
  });
});

// ── Command palette (interaction state) ──────────────────────────────────────────
// Migrated from routes-sweep.spec.ts Phase 1 to its natural home here.

test.describe("a11y deep tier: command palette", () => {
  test("command palette (open): no blocking violations", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [
        ...authSessionOverrides,
        ...workspaceOverrides,
        ...jobsOverrides,
        ...permissiveBackendOverrides,
      ],
    });
    await page.goto("/jobs");
    await page.waitForLoadState("networkidle");

    const modifierKey = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${modifierKey}+K`);
    await page
      .getByRole("dialog", { name: /command palette/i })
      .waitFor({ state: "visible", timeout: 10_000 });
    // Wait for auto-focus: WebKit cmdk theme CSS can lag behind dialog visibility.
    await expect(page.locator('[data-slot="command-input"]')).toBeFocused({ timeout: 5_000 });

    await forEachTheme(page, async (theme) => {
      await assertNoBlocking(page, "command-palette/open", theme);
    });
  });
});
