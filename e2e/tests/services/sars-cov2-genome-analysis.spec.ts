import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  authSessionOverrides,
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

// computeOutputName("Severe acute respiratory syndrome coronavirus 2", "e2e-label")
const sc2OutputFile =
  "Severe acute respiratory syndrome coronavirus 2 e2e-label";

test.describe("sars-cov2-genome-analysis — contigs mode submission", () => {
  async function preFillContigsMode(page: import("@playwright/test").Page) {
    await page.addInitScript((outputFile: string) => {
      sessionStorage.setItem(
        "e2e-sc2-rerun",
        JSON.stringify({
          output_path: "/e2e-test-user@patricbrc.org/home",
          output_file: outputFile,
          input_type: "contigs",
          contigs: "/e2e-test-user@patricbrc.org/home/assembly.fasta",
          my_label: "e2e-label",
          taxonomy_id: "2697049",
        }),
      );
    }, sc2OutputFile);
  }

  test("submitting contigs mode POSTs contigs path, taxonomy fields, and output", async ({
    page,
  }) => {
    const submittedJob = {
      id: "job-sc2",
      app: "ComprehensiveSARS2Analysis",
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
        // Taxonomy lookup fires during rerun onApply to hydrate scientific_name.
        {
          url: "/api/services/taxonomy",
          method: "GET",
          body: [
            {
              taxon_id: 2697049,
              taxon_name:
                "Severe acute respiratory syndrome coronavirus 2",
              taxon_rank: "species",
            },
          ],
        },
        ...journeyOverrides,
      ],
    });

    await preFillContigsMode(page);

    const form = new ServiceFormPage(page, /sars-cov-?2 genome analysis/i);
    await form.goto(
      "/services/sars-cov2-genome-analysis?rerun_key=e2e-sc2-rerun",
    );

    // The taxonomy lookup + useEffect recomputes output_file from scientific_name + my_label.
    await expect(page.getByPlaceholder(/select output name/i)).toHaveValue(
      sc2OutputFile,
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
    expect(payload.app_name).toBe("ComprehensiveSARS2Analysis");
    expect(payload.app_params).toMatchObject({
      contigs: "/e2e-test-user@patricbrc.org/home/assembly.fasta",
      input_type: "contigs",
      output_file: sc2OutputFile,
    });
  });
});

test.describe("sars-cov2-genome-analysis — render", () => {
  test("renders heading and start-with card radio options", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [
        ...authSessionOverrides,
        ...buildWorkspaceOverrides(),
        ...buildJobsOverrides(),
        // Default form values for scientific_name and taxonomy_id are non-empty,
        // so TaxonNameSelector / TaxIDSelector fire taxonomy requests on mount.
        {
          url: "/api/services/taxonomy",
          method: "GET",
          body: [
            {
              taxon_id: 2697049,
              taxon_name:
                "Severe acute respiratory syndrome coronavirus 2",
              taxon_rank: "species",
            },
          ],
        },
        ...journeyOverrides,
      ],
    });

    const form = new ServiceFormPage(page, /sars-cov-?2 genome analysis/i);
    await form.goto("/services/sars-cov2-genome-analysis");
    await expect(form.heading).toBeVisible();
    await expect(
      page.getByRole("radio", { name: /read file/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("radio", { name: /assembled contigs/i }),
    ).toBeVisible();
  });
});
