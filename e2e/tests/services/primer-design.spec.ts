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
