import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  authSessionOverrides,
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

test.describe("msa-snp-analysis — FASTA file input submission", () => {
  async function preFillFastaFile(page: import("@playwright/test").Page) {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        "e2e-msa-rerun",
        JSON.stringify({
          output_path: "/e2e-test-user@patricbrc.org/home",
          output_file: "msa-e2e",
          input_status: "unaligned",
          input_type: "input_fasta",
          fasta_files: [
            {
              file: "/e2e-test-user@patricbrc.org/home/sequences.fasta",
              type: "feature_dna_fasta",
            },
          ],
          ref_type: "none",
          alphabet: "dna",
        }),
      );
    });
  }

  test("submitting FASTA file input POSTs fasta_files, ref_type, and output fields", async ({
    page,
  }) => {
    const submittedJob = {
      id: "job-msa",
      app: "MSA",
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

    await preFillFastaFile(page);

    const form = new ServiceFormPage(page, /msa.*snp|msa.*variation/i);
    await form.goto("/services/msa-snp-analysis?rerun_key=e2e-msa-rerun");

    await expect(page.getByPlaceholder(/select output name/i)).toHaveValue(
      "msa-e2e",
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
    expect(payload.app_name).toBe("MSA");
    const fastaFiles = payload.app_params?.fasta_files as
      | { file?: string; type?: string }[]
      | undefined;
    expect(Array.isArray(fastaFiles)).toBe(true);
    expect(fastaFiles).toHaveLength(1);
    expect(fastaFiles?.[0]).toMatchObject({
      file: "/e2e-test-user@patricbrc.org/home/sequences.fasta",
      type: "feature_dna_fasta",
    });
    expect(payload.app_params).toMatchObject({
      output_file: "msa-e2e",
    });
  });
});

test.describe("msa-snp-analysis — render", () => {
  test("renders heading and start-with card radio options", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [
        ...authSessionOverrides,
        ...buildWorkspaceOverrides(),
        ...buildJobsOverrides(),
        ...journeyOverrides,
      ],
    });

    const form = new ServiceFormPage(page, /msa.*snp|msa.*variation/i);
    await form.goto("/services/msa-snp-analysis");
    await expect(form.heading).toBeVisible();
    await expect(
      page.getByRole("radio", { name: /unaligned sequences/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("radio", { name: /aligned sequences/i }).first(),
    ).toBeVisible();
  });
});
