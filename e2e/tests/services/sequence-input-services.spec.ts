import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  authSessionOverrides,
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

test.describe("blast submission (sequence-input family)", () => {
  function captureReactRegressions(page: import("@playwright/test").Page) {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    return errors;
  }

  async function preFillRerunData(
    page: import("@playwright/test").Page,
    overrides: Record<string, unknown> = {},
  ) {
    await page.addInitScript((rerunOverrides) => {
      sessionStorage.setItem(
        "e2e-blast-rerun",
        JSON.stringify({
          output_path: "/e2e-test-user@patricbrc.org/home",
          output_file: "blast-e2e",
          input_source: "fasta_data",
          input_fasta_data: ">seq\nACGTACGTACGTA\n",
          db_type: "fna",
          ...rerunOverrides,
        }),
      );
    }, overrides);
  }

  test("keeps database types valid across every program transition without React errors", async ({
    page,
  }) => {
    await applyBackendMocks(page, {
      overrides: [
        ...authSessionOverrides,
        ...buildWorkspaceOverrides({
          searchItems: [
            {
              id: "shared-workspace-id",
              name: "first-folder",
              type: "folder",
              parentPath: "/e2e-test-user@patricbrc.org/home",
            },
            {
              id: "shared-workspace-id",
              name: "second-folder",
              type: "folder",
              parentPath: "/e2e-test-user@patricbrc.org/home",
            },
          ],
        }),
        ...buildJobsOverrides(),
        ...journeyOverrides,
      ],
    });
    const reactErrors = captureReactRegressions(page);

    await page.goto("/services/blast");
    await expect(
      page.getByRole("heading", { level: 1, name: /blast/i }),
    ).toBeVisible();

    const databaseType = page.getByRole("combobox", { name: "Database Type" });
    const databaseSource = page.getByRole("combobox", {
      name: "Database Source",
    });

    await databaseType.click();
    await page.getByRole("option", { name: /^Genes \(NT\)$/i }).click();
    await expect(databaseType).toHaveText(/Genes \(NT\)/i);

    await page.getByText(/^tBLASTn \(/i).click();
    await expect(databaseType).toHaveText(/Genes \(NT\)/i);

    await databaseSource.click();
    await page
      .getByRole("option", { name: /^Search within selected genome list$/i })
      .click();
    await expect(databaseType).toHaveText(/Genes \(NT\)/i);

    await databaseSource.click();
    await page
      .getByRole("option", { name: /^Search within selected FASTA file$/i })
      .click();
    await expect(databaseType).toHaveText(/Genome sequences \(NT\)/i);

    for (const [program, expectedType] of [
      ["BLASTP", /Proteins \(AA\)/i],
      ["BLASTX", /Proteins \(AA\)/i],
      ["BLASTN", /Genome sequences \(NT\)/i],
    ] as const) {
      await page.getByText(new RegExp(`^${program} \\(`, "i")).click();
      await expect(databaseType).toHaveText(expectedType);
    }

    const outputFolder = page.getByPlaceholder("Search for folders...");
    await outputFolder.focus();
    await outputFolder
      .locator("xpath=..")
      .getByRole("button", { name: "Show suggestions" })
      .click();
    await expect(
      page.getByRole("button", { name: /first-folder/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /second-folder/i }),
    ).toBeVisible();

    expect(
      reactErrors.filter(
        (message) =>
          message.includes("Cannot update a component") ||
          message.includes("Encountered two children with the same key"),
      ),
    ).toEqual([]);
  });

  test("normalizes incompatible rerun state before submission", async ({
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
    await preFillRerunData(page, {
      blast_program: "blastp",
      db_precomputed_database: "selGenome",
      db_type: "fna",
    });

    await page.goto("/services/blast?rerun_key=e2e-blast-rerun");

    await expect(page.getByRole("radio", { name: /^blastp /i })).toBeChecked();
    await expect(
      page.getByRole("combobox", { name: "Database Source" }),
    ).toHaveText(/Search within selected genome list/i);
    await expect(
      page.getByRole("combobox", { name: "Database Type" }),
    ).toHaveText(/Proteins \(AA\)/i);

    await page.getByRole("button", { name: /^reset$/i }).click();
    await expect(page.getByRole("radio", { name: /^blastn /i })).toBeChecked();
    await expect(
      page.getByRole("combobox", { name: "Database Source" }),
    ).toHaveText(/Reference and representative genomes \(bacteria, archaea\)/i);
    await expect(
      page.getByRole("combobox", { name: "Database Type" }),
    ).toHaveText(/Genome sequences \(NT\)/i);
  });

  test("submitting a BLAST query POSTs the expected app_params payload", async ({
    page,
  }) => {
    const submittedJob = {
      id: "job-blast",
      app: "Homology",
      status: "queued" as const,
      submit_time: "2026-04-24T12:00:00Z",
      owner: "e2e-test-user",
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

    await preFillRerunData(page);

    const form = new ServiceFormPage(page, /^blast$/i);
    await form.goto("/services/blast?rerun_key=e2e-blast-rerun");

    await expect(page.getByPlaceholder(/select output name/i)).toHaveValue(
      "blast-e2e",
    );
    const fastaInput = page.getByRole("textbox", {
      name: /enter one or more source nucleotide/i,
    });
    await fastaInput.clear();
    await fastaInput.fill(">seq\nACGTACGTACGTA\n");
    await expect(page.getByText(/valid fasta/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^submit$/i })).toBeEnabled();

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
    expect(payload.app_name).toBe("Homology");
    expect(payload.app_params).toMatchObject({
      output_path: "/e2e-test-user@patricbrc.org/home",
      output_file: "blast-e2e",
      input_source: "fasta_data",
      input_fasta_data: ">seq\nACGTACGTACGTA\n",
      blast_program: "blastn",
      db_precomputed_database: "bacteria-archaea",
      db_source: "precomputed_database",
      db_type: "fna",
    });
  });
});
