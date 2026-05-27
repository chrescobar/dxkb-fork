import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
  publicDataOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

test.describe("fastq-utilities — tutorial walkthrough (debug mode)", () => {
  // Tutorial: https://www.bv-brc.org/docs/tutorial/fastq_utilities/fastq_utilities.html
  //
  // The BV-BRC fastq-utilities tutorial is a generic UI walkthrough — no
  // concrete read files, SRA accession, recipe, or output name is given.
  // The inputs below use a single paired-end library with the canonical
  // ["trim", "align"] pipeline (which requires a target genome — supplied
  // here as Mycobacterium tuberculosis H37Rv = 83332.12 to also exercise
  // the rerun-only reference_genome_id field) and a representative output
  // name in the test user's workspace.
  //
  // Rerun coverage: `fastq-utilities-service.ts` declares
  // `fields: ["output_path", "output_file", "reference_genome_id"]`. The
  // page-level rerun extends with `libraries: ["paired", "single", "sra"]`
  // + `syncLibraries` (with `getLibraryExtra` for the platform field on
  // single libs) and an `onApply` that normalizes the recipe array.
  const tutorialRerunPayload = {
    output_path: "/e2e-test-user@patricbrc.org/home",
    output_file: "tutorial-fastq-utils",
    recipe: ["trim", "align"],
    reference_genome_id: "83332.12",
    paired_end_libs: [
      {
        read1:
          "/e2e-test-user@patricbrc.org/home/tutorial_R1.fq",
        read2:
          "/e2e-test-user@patricbrc.org/home/tutorial_R2.fq",
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
        // SingleGenomeSelector for the Target Genome (Align) field resolves
        // the rerun-supplied id via `/api/services/genome/by-ids`.
        ...publicDataOverrides,
      ],
    });

    // Page heading is "FastQ Utilities" — match case-insensitively to also
    // allow "Fastq" / "FASTQ" rendering variants.
    const form = new ServiceFormPage(page, /fastq utilities/i);
    await form.enableDebugMode();
    await form.seedRerun(tutorialRerunPayload);
    await form.goto("/services/fastq-utilities?rerun_key=e2e-rerun");

    // Submit only enables once the schema's "at least one library" rule and
    // the "reference_genome_id is required when align is selected" rule
    // both pass — both supplied via rerun.
    await expect(
      page.getByRole("button", { name: /^submit$/i }),
    ).toBeEnabled({ timeout: 10_000 });

    await form.submit(/^submit$/i);

    const params = await form.readSubmittedParams("FastqUtils");
    expect(params).toMatchObject({
      output_path: "/e2e-test-user@patricbrc.org/home",
      output_file: "tutorial-fastq-utils",
      recipe: ["trim", "align"],
      reference_genome_id: "83332.12",
      paired_end_libs: [
        expect.objectContaining({
          read1:
            "/e2e-test-user@patricbrc.org/home/tutorial_R1.fq",
          read2:
            "/e2e-test-user@patricbrc.org/home/tutorial_R2.fq",
        }),
      ],
    });
  });
});
