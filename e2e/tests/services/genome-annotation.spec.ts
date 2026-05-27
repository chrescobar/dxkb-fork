import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
  publicDataOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

test.describe("genome annotation — tutorial walkthrough (debug mode)", () => {
  // Tutorial: https://www.bv-brc.org/docs/tutorial/genome_annotation/genome_annotation.html
  //
  // The BV-BRC genome-annotation tutorial is a generic UI walkthrough — no
  // concrete contigs path, taxonomy name/ID, or output name is given. The
  // inputs below use the default recipe ("default" → Bacteria / Archaea) and
  // a representative taxonomy (Mycobacterium tuberculosis H37Rv, taxon_id
  // 83332) with a placeholder contigs file in the test user's workspace.
  //
  // Rerun coverage: `genome-annotation-service.ts` declares
  // `fields: ["contigs", "recipe", "output_path", "output_file"]` and an
  // `onApply` that resolves `taxonomy_id` → `scientific_name` via the
  // `/api/services/taxonomy` lookup (stubbed in `publicDataOverrides`).
  // `my_label` is also copied off the rerun payload by `onApply`.
  const tutorialRerunPayload = {
    contigs:
      "/e2e-test-user@patricbrc.org/home/tutorial_contigs.fasta",
    recipe: "default",
    taxonomy_id: "83332",
    my_label: "tutorial-run",
    output_path: "/e2e-test-user@patricbrc.org/home",
    output_file: "tutorial-annotation",
  };

  test("submitting in debug mode renders the tutorial-derived params in JobParamsDialog", async ({
    page,
  }) => {
    await applyBackendMocks(page, {
      overrides: [
        ...buildWorkspaceOverrides(),
        ...buildJobsOverrides(),
        ...journeyOverrides,
        ...publicDataOverrides,
      ],
    });

    const form = new ServiceFormPage(page, /genome annotation/i);
    await form.enableDebugMode();
    await form.seedRerun(tutorialRerunPayload);
    await form.goto("/services/genome-annotation?rerun_key=e2e-rerun");

    // Submit button is labeled "Annotate" on this page.
    await expect(
      page.getByRole("button", { name: /^annotate$/i }),
    ).toBeEnabled({ timeout: 10_000 });

    await form.submit(/^annotate$/i);

    const params = await form.readSubmittedParams("GenomeAnnotation");
    expect(params).toMatchObject({
      contigs:
        "/e2e-test-user@patricbrc.org/home/tutorial_contigs.fasta",
      recipe: "default",
      scientific_name: "Mycobacterium tuberculosis H37Rv",
      taxonomy_id: "83332",
      my_label: "tutorial-run",
      output_path: "/e2e-test-user@patricbrc.org/home",
      output_file: "tutorial-annotation",
    });
  });
});
