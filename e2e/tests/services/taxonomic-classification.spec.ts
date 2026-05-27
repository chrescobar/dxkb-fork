import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  authSessionOverrides,
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

test.describe("taxonomic-classification — WGS paired-end submission", () => {
  async function preFillWgsPaired(page: import("@playwright/test").Page) {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        "e2e-tc-rerun",
        JSON.stringify({
          output_path: "/e2e-test-user@patricbrc.org/home",
          output_file: "tc-e2e",
          sequence_type: "wgs",
          analysis_type: "microbiome",
          database: "bvbrc",
          confidence_interval: "0.1",
          host_genome: "no_host",
          paired_end_libs: [
            {
              read1: "/e2e-test-user@patricbrc.org/home/sample_R1.fq",
              read2: "/e2e-test-user@patricbrc.org/home/sample_R2.fq",
              sample_id: "sample1",
            },
          ],
        }),
      );
    });
  }

  test("submitting WGS paired-end POSTs paired_end_libs, sequence_type, and output fields", async ({
    page,
  }) => {
    const submittedJob = {
      id: "job-tc",
      app: "TaxonomicClassification",
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

    await preFillWgsPaired(page);

    const form = new ServiceFormPage(page, /taxonomic classification/i);
    await form.goto(
      "/services/taxonomic-classification?rerun_key=e2e-tc-rerun",
    );

    await expect(page.getByPlaceholder(/select output name/i)).toHaveValue(
      "tc-e2e",
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
    expect(payload.app_name).toBe("TaxonomicClassification");
    const pairedLibs = payload.app_params?.paired_end_libs as
      | { read1?: string; read2?: string }[]
      | undefined;
    expect(Array.isArray(pairedLibs)).toBe(true);
    expect(pairedLibs?.length).toBeGreaterThanOrEqual(1);
    expect(pairedLibs?.[0].read1).toMatch(/sample_R1\.fq$/);
    expect(payload.app_params).toMatchObject({
      output_file: "tc-e2e",
    });
  });
});

test.describe("taxonomic-classification — tutorial walkthrough (debug mode)", () => {
  // Tutorial: https://www.bv-brc.org/docs/tutorial/taxonomic_classification/taxonomic_classification.html
  //
  // The BV-BRC taxonomic-classification tutorial is a generic UI walkthrough —
  // no concrete read files, accession, or output name are given. The inputs
  // below use the WGS paired-end branch with the default `microbiome` analysis
  // and `bvbrc` database. confidence_interval=0.1 matches the form default.
  //
  // Fields exercised: output_path, output_file, analysis_type, database,
  // host_genome, confidence_interval (per service rerun.fields) + paired-end
  // libraries via the page's rerun libraries extension. sequence_type is
  // hydrated by the rerun onApply when present.
  const tutorialRerunPayload = {
    output_path: "/e2e-test-user@patricbrc.org/home",
    output_file: "tutorial-taxonomic",
    sequence_type: "wgs",
    analysis_type: "microbiome",
    database: "bvbrc",
    host_genome: "no_host",
    confidence_interval: "0.1",
    paired_end_libs: [
      {
        read1: "/e2e-test-user@patricbrc.org/home/tutorial_R1.fq",
        read2: "/e2e-test-user@patricbrc.org/home/tutorial_R2.fq",
        sample_id: "tutorial-sample",
      },
    ],
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

    const form = new ServiceFormPage(page, /taxonomic classification/i);
    await form.enableDebugMode();
    await form.seedRerun(tutorialRerunPayload);
    await form.goto(
      "/services/taxonomic-classification?rerun_key=e2e-rerun",
    );

    await expect(
      page.getByRole("button", { name: /^submit$/i }),
    ).toBeEnabled({ timeout: 10_000 });

    await form.submit(/^submit$/i);

    const params = await form.readSubmittedParams("TaxonomicClassification");
    expect(params).toMatchObject({
      output_path: "/e2e-test-user@patricbrc.org/home",
      output_file: "tutorial-taxonomic",
      analysis_type: "microbiome",
      database: "bvbrc",
      host_genome: "no_host",
      confidence_interval: "0.1",
      sequence_type: "wgs",
      paired_end_libs: [
        expect.objectContaining({
          read1: "/e2e-test-user@patricbrc.org/home/tutorial_R1.fq",
          read2: "/e2e-test-user@patricbrc.org/home/tutorial_R2.fq",
        }),
      ],
    });
  });
});

test.describe("taxonomic-classification — render", () => {
  test("renders heading, sequencing type radio, and parameters card", async ({
    page,
  }) => {
    await applyBackendMocks(page, {
      overrides: [
        ...authSessionOverrides,
        ...buildWorkspaceOverrides(),
        ...buildJobsOverrides(),
        ...journeyOverrides,
      ],
    });

    const form = new ServiceFormPage(page, /taxonomic classification/i);
    await form.goto("/services/taxonomic-classification");
    await expect(form.heading).toBeVisible();
    await expect(
      page.getByRole("radio", { name: /whole genome sequencing/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("radio", { name: /16s ribosomal rna/i }),
    ).toBeVisible();
    await expect(page.getByText(/analysis type/i)).toBeVisible();
  });
});
