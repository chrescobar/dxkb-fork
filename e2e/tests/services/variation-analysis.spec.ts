import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
  publicDataOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

test.describe("variation-analysis — tutorial walkthrough (debug mode)", () => {
  // Tutorial: https://www.bv-brc.org/docs/tutorial/variation_analysis/variation_analysis.html
  //
  // The BV-BRC variation-analysis tutorial is a generic UI walkthrough — no
  // concrete reference genome ID, read library, aligner choice, or output
  // name is given. The inputs below use the form defaults (BWA-mem aligner,
  // FreeBayes caller) against a representative public reference
  // (Mycobacterium tuberculosis H37Rv = 83332.12) with a single paired-end
  // library in the test user's workspace.
  //
  // Rerun coverage: `variation-analysis-service.ts` declares
  // `fields: ["output_path", "output_file", "reference_genome_id", "mapper",
  // "caller"]`. The page-level rerun extends with
  // `libraries: ["paired", "single", "sra"]` + `syncLibraries` so the
  // shared library builders hydrate `paired_end_libs` from rerunData.
  const tutorialRerunPayload = {
    output_path: "/e2e-test-user@patricbrc.org/home",
    output_file: "tutorial-variation",
    reference_genome_id: "83332.12",
    mapper: "BWA-mem",
    caller: "FreeBayes",
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
        // SingleGenomeSelector for the reference_genome_id field resolves
        // the rerun-supplied id via `/api/services/genome/by-ids`.
        ...publicDataOverrides,
      ],
    });

    const form = new ServiceFormPage(page, /variation analysis/i);
    await form.enableDebugMode();
    await form.seedRerun(tutorialRerunPayload);
    await form.goto("/services/variation-analysis?rerun_key=e2e-rerun");

    // Submit only enables once `canSubmit` flips true — the schema enforces
    // at least one library, so this also confirms the rerun-supplied
    // paired_end_lib was applied via syncLibraries.
    await expect(
      page.getByRole("button", { name: /^submit$/i }),
    ).toBeEnabled({ timeout: 10_000 });

    await form.submit(/^submit$/i);

    const params = await form.readSubmittedParams("Variation");
    expect(params).toMatchObject({
      output_path: "/e2e-test-user@patricbrc.org/home",
      output_file: "tutorial-variation",
      reference_genome_id: "83332.12",
      mapper: "BWA-mem",
      caller: "FreeBayes",
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
