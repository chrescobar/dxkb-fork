import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
  publicDataOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

test.describe("genome alignment — tutorial walkthrough (debug mode)", () => {
  // Tutorial: https://www.bv-brc.org/docs/tutorial/genome_alignment/genome_alignment.html
  //
  // The BV-BRC genome-alignment tutorial is a generic UI walkthrough — no
  // concrete genome IDs, seed weight, or output name are given. The inputs
  // below mirror the default progressiveMauve recipe against two
  // representative public genomes (Mycobacterium tuberculosis H37Rv and
  // Mycobacterium bovis AF2122/97 — the two strains the form's default
  // suggestions surface).
  //
  // Rerun coverage: `genome-alignment-service.ts` declares
  // `fields: ["output_path", "output_file"]`. The page-level rerun
  // (`page.tsx`) extends with an `onApply` that calls `fetchGenomesByIds`
  // for `genome_ids` and copies `manual_seed_weight`, `seed_weight`,
  // `weight` directly. `publicDataOverrides` stubs the by-ids lookup.
  const tutorialRerunPayload = {
    output_path: "/e2e-test-user@patricbrc.org/home",
    output_file: "tutorial-alignment",
    genome_ids: ["83332.12", "233413.5"],
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

    const form = new ServiceFormPage(page, /genome alignment/i);
    await form.enableDebugMode();
    await form.seedRerun(tutorialRerunPayload);
    await form.goto("/services/genome-alignment?rerun_key=e2e-rerun");

    // genome_ids hydrate asynchronously via fetchGenomesByIds → addGenome,
    // so wait for the submit button to enable (which requires
    // hasMinimumGenomes = selectedGenomes.length >= 2).
    await expect(page.getByRole("button", { name: /^submit$/i })).toBeEnabled({
      timeout: 10_000,
    });

    await form.submit(/^submit$/i);

    const params = await form.readSubmittedParams("GenomeAlignment");
    expect(params).toMatchObject({
      genome_ids: ["83332.12", "233413.5"],
      recipe: "progressiveMauve",
      output_path: "/e2e-test-user@patricbrc.org/home",
      output_file: "tutorial-alignment",
      // transformGenomeAlignmentParams emits seedWeight: null when
      // manual_seed_weight is false (the default).
      seedWeight: null,
    });
  });
});
