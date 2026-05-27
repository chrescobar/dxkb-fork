import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  authSessionOverrides,
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

test.describe("meta-cats — files mode submission", () => {
  async function preFillFilesMode(page: import("@playwright/test").Page) {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        "e2e-metacats-files",
        JSON.stringify({
          output_path: "/e2e-test-user@patricbrc.org/home",
          output_file: "metacats-files-e2e",
          input_type: "files",
          alignment_file:
            "/e2e-test-user@patricbrc.org/home/alignment.fasta",
          group_file: "/e2e-test-user@patricbrc.org/home/groups.tsv",
        }),
      );
    });
  }

  test("submitting files-mode POSTs alignment_file, group_file, and output fields", async ({
    page,
  }) => {
    const submittedJob = {
      id: "job-metacats-files",
      app: "MetaCATS",
      status: "queued" as const,
      submit_time: "2026-04-24T12:00:00Z",
      parameters: {},
    };
    await applyBackendMocks(page, {
      overrides: [
        ...authSessionOverrides,
        ...buildWorkspaceOverrides(),
        ...buildJobsOverrides({
          jobs: [submittedJob],
          submitResponse: { job: [submittedJob] },
        }),
        ...journeyOverrides,
      ],
    });

    await preFillFilesMode(page);

    const form = new ServiceFormPage(page, /meta-cats/i);
    await form.goto("/services/meta-cats?rerun_key=e2e-metacats-files");

    await expect(page.getByPlaceholder(/select output name/i)).toHaveValue(
      "metacats-files-e2e",
    );
    await expect(
      page.getByRole("button", { name: /^submit$/i }),
    ).toBeEnabled();

    const submitRequest = page.waitForRequest(
      (req) =>
        req.url().endsWith("/api/services/app-service/submit") &&
        req.method() === "POST",
    );
    await form.submit(/^submit$/i);
    const req = await submitRequest;
    const payload = req.postDataJSON() as {
      app_name?: string;
      app_params?: Record<string, unknown>;
    };
    expect(payload.app_name).toBe("MetaCATS");
    expect(payload.app_params).toMatchObject({
      alignment_file:
        "/e2e-test-user@patricbrc.org/home/alignment.fasta",
      group_file: "/e2e-test-user@patricbrc.org/home/groups.tsv",
      output_file: "metacats-files-e2e",
    });
  });
});

test.describe("meta-cats — feature-groups mode submission", () => {
  async function preFillGroupsMode(page: import("@playwright/test").Page) {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        "e2e-metacats-groups",
        JSON.stringify({
          output_path: "/e2e-test-user@patricbrc.org/home",
          output_file: "metacats-groups-e2e",
          input_type: "groups",
          groups: [
            "/e2e-test-user@patricbrc.org/home/group_a.fg",
            "/e2e-test-user@patricbrc.org/home/group_b.fg",
          ],
          group_alphabet: "aa",
        }),
      );
    });
  }

  test("submitting groups-mode POSTs groups array and alphabet", async ({
    page,
  }) => {
    const submittedJob = {
      id: "job-metacats-groups",
      app: "MetaCATS",
      status: "queued" as const,
      submit_time: "2026-04-24T12:00:00Z",
      parameters: {},
    };
    await applyBackendMocks(page, {
      overrides: [
        ...authSessionOverrides,
        ...buildWorkspaceOverrides(),
        ...buildJobsOverrides({
          jobs: [submittedJob],
          submitResponse: { job: [submittedJob] },
        }),
        ...journeyOverrides,
      ],
    });

    await preFillGroupsMode(page);

    const form = new ServiceFormPage(page, /meta-cats/i);
    await form.goto("/services/meta-cats?rerun_key=e2e-metacats-groups");

    await expect(page.getByPlaceholder(/select output name/i)).toHaveValue(
      "metacats-groups-e2e",
    );
    await expect(
      page.getByRole("button", { name: /^submit$/i }),
    ).toBeEnabled();

    const submitRequest = page.waitForRequest(
      (req) =>
        req.url().endsWith("/api/services/app-service/submit") &&
        req.method() === "POST",
    );
    await form.submit(/^submit$/i);
    const req = await submitRequest;
    const payload = req.postDataJSON() as {
      app_name?: string;
      app_params?: Record<string, unknown>;
    };
    expect(payload.app_name).toBe("MetaCATS");
    const groups = payload.app_params?.groups as string[] | undefined;
    expect(Array.isArray(groups)).toBe(true);
    expect(groups).toHaveLength(2);
    expect(payload.app_params).toMatchObject({
      alphabet: "aa",
      output_file: "metacats-groups-e2e",
    });
  });
});

test.describe("meta-cats — tutorial walkthrough (debug mode)", () => {
  // Tutorial: https://www.bv-brc.org/docs/tutorial/metacats/metacats.html
  //
  // The BV-BRC Meta-CATS tutorial is a generic UI walkthrough — no concrete
  // alignment file, group file, or output name are given. The inputs below
  // use the simplest path: input_type="files" with placeholder alignment +
  // group files. group_alphabet="na" matches a typical nucleotide alignment.
  //
  // Fields exercised: output_path, output_file, input_type, group_alphabet.
  // The service rerun also declares `metadata_group` and `auto_alphabet`
  // (auto-mode-only). alignment_file/group_file flow through the page-level
  // onApply rerun extension.
  const tutorialRerunPayload = {
    output_path: "/e2e-test-user@patricbrc.org/home",
    output_file: "tutorial-metacats",
    input_type: "files",
    alignment_file:
      "/e2e-test-user@patricbrc.org/home/tutorial_alignment.fasta",
    group_file: "/e2e-test-user@patricbrc.org/home/tutorial_groups.tsv",
    group_alphabet: "na",
    auto_alphabet: "na",
  };

  test("submitting in debug mode renders the tutorial-derived params in JobParamsDialog", async ({
    page,
  }) => {
    await applyBackendMocks(page, {
      overrides: [
        ...buildWorkspaceOverrides(),
        ...buildJobsOverrides(),
        ...journeyOverrides,
      ],
    });

    const form = new ServiceFormPage(page, /meta-cats/i);
    await form.enableDebugMode();
    await form.seedRerun(tutorialRerunPayload);
    await form.goto("/services/meta-cats?rerun_key=e2e-rerun");

    await expect(
      page.getByRole("button", { name: /^submit$/i }),
    ).toBeEnabled({ timeout: 10_000 });

    await form.submit(/^submit$/i);

    const params = await form.readSubmittedParams("MetaCATS");
    expect(params).toMatchObject({
      output_path: "/e2e-test-user@patricbrc.org/home",
      output_file: "tutorial-metacats",
      input_type: "files",
      alignment_file:
        "/e2e-test-user@patricbrc.org/home/tutorial_alignment.fasta",
      group_file: "/e2e-test-user@patricbrc.org/home/tutorial_groups.tsv",
      // No alignment_type set, transform defaults to "na" alphabet.
      alphabet: "na",
    });
  });
});

test.describe("meta-cats — render", () => {
  test("renders heading and p-value field", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [
        ...authSessionOverrides,
        ...buildWorkspaceOverrides(),
        ...buildJobsOverrides(),
        ...journeyOverrides,
      ],
    });

    const form = new ServiceFormPage(page, /meta-cats/i);
    await form.goto("/services/meta-cats");
    await expect(form.heading).toBeVisible();
    await expect(page.getByText(/p-value/i)).toBeVisible();
    await expect(
      page.getByRole("radio", { name: /auto grouping/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("radio", { name: /feature groups/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("radio", { name: /alignment file/i }),
    ).toBeVisible();
  });
});
