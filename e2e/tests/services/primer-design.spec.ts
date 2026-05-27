import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  authSessionOverrides,
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

test.describe("primer-design — paste sequence submission", () => {
  async function preFillPasteSequence(page: import("@playwright/test").Page) {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        "e2e-pd-rerun",
        JSON.stringify({
          output_path: "/e2e-test-user@patricbrc.org/home",
          output_file: "pd-e2e",
          input_type: "sequence_text",
          sequence_input: "ATCGATCGATCGATCG",
          SEQUENCE_ID: "my-seq",
          PRIMER_PRODUCT_SIZE_RANGE: ["50-500"],
        }),
      );
    });
  }

  test("submitting a paste-sequence primer design POSTs sequence_input, SEQUENCE_ID, and output", async ({
    page,
  }) => {
    const submittedJob = {
      id: "job-pd",
      app: "PrimerDesign",
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

    await preFillPasteSequence(page);

    const form = new ServiceFormPage(page, /primer design/i);
    await form.goto("/services/primer-design?rerun_key=e2e-pd-rerun");

    await expect(page.getByPlaceholder(/select output name/i)).toHaveValue(
      "pd-e2e",
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
    expect(payload.app_name).toBe("PrimerDesign");
    expect(payload.app_params).toMatchObject({
      sequence_input: "ATCGATCGATCGATCG",
      SEQUENCE_ID: "my-seq",
      output_file: "pd-e2e",
    });
  });
});

test.describe("primer-design — tutorial walkthrough (debug mode)", () => {
  // Tutorial: https://www.bv-brc.org/docs/tutorial/primer_design/primer_design.html
  //
  // The BV-BRC primer-design tutorial is a generic UI walkthrough — no
  // concrete sequence, SEQUENCE_ID, output name, or primer parameter values
  // are given. The inputs below use the canonical paste-sequence flow
  // (input_type="sequence_text") with a representative DNA sequence and
  // the form's default PRIMER_PRODUCT_SIZE_RANGE.
  //
  // Rerun coverage: `primer-design-service.ts` declares
  // `fields: ["output_path", "output_file"]`. Everything else
  // (input_type, sequence_input, SEQUENCE_ID, PRIMER_PRODUCT_SIZE_RANGE,
  // primer scalar fields) flows through the page-level `onApply` extension.
  //
  // NOTE: The page passes `serviceName="Primer Design"` to JobParamsDialog
  // explicitly, overriding the default `definition.serviceName ===
  // "PrimerDesign"`, so the dialog title is "Primer Design Submission
  // Params:" — pass that exact string to `readSubmittedParams`.
  const tutorialRerunPayload = {
    output_path: "/e2e-test-user@patricbrc.org/home",
    output_file: "tutorial-primer-design",
    input_type: "sequence_text",
    sequence_input:
      "ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG",
    SEQUENCE_ID: "tutorial-seq",
    PRIMER_PRODUCT_SIZE_RANGE: ["50-500"],
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

    const form = new ServiceFormPage(page, /primer design/i);
    await form.enableDebugMode();
    await form.seedRerun(tutorialRerunPayload);
    await form.goto("/services/primer-design?rerun_key=e2e-rerun");

    await expect(
      page.getByRole("button", { name: /^submit$/i }),
    ).toBeEnabled({ timeout: 10_000 });

    await form.submit(/^submit$/i);

    // Dialog title uses the overridden serviceName "Primer Design" (with a
    // space), not the JSON-RPC name "PrimerDesign".
    const params = await form.readSubmittedParams("Primer Design");
    expect(params).toMatchObject({
      output_path: "/e2e-test-user@patricbrc.org/home",
      output_file: "tutorial-primer-design",
      input_type: "sequence_text",
      // sequence_input is run through getSequenceForSubmission, which strips
      // the FASTA header (none here) and joins lines into a single string.
      sequence_input:
        "ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG",
      SEQUENCE_ID: "tutorial-seq",
      // transformPrimerDesignParams joins array values with spaces and
      // replaces commas with hyphens for PRIMER_PRODUCT_SIZE_RANGE.
      PRIMER_PRODUCT_SIZE_RANGE: "50-500",
      // PRIMER_PICK_INTERNAL_OLIGO defaults to true.
      PRIMER_PICK_INTERNAL_OLIGO: true,
    });
  });
});

test.describe("primer-design — render", () => {
  test("renders heading, Paste Sequence tab, and Workspace FASTA tab", async ({
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

    const form = new ServiceFormPage(page, /primer design/i);
    await form.goto("/services/primer-design");
    await expect(form.heading).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /paste sequence/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /workspace fasta/i }),
    ).toBeVisible();
    await expect(page.getByText(/product size range/i)).toBeVisible();
  });
});
