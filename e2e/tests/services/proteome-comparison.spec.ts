import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
  publicDataOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

test.describe("proteome-comparison — tutorial walkthrough (debug mode)", () => {
  // Tutorial: https://www.bv-brc.org/docs/tutorial/proteome_comparison/proteome_comparison.html
  //
  // The BV-BRC proteome-comparison tutorial cites the following concrete
  // default thresholds: min_seq_cov=30%, min_ident=10%, max_e_val=1e-5
  // ("The default parameters for BLASTP in the Proteome Comparison tool
  // are a minimum coverage of 30%, a minimum identity of 10% and a BLAST
  // E-value of 1e-5"). No concrete reference genome ID, comparison genome
  // IDs, or output name is given. The inputs below mirror those defaults
  // and use two representative public genomes (Mycobacterium tuberculosis
  // H37Rv = 83332.12 as reference, Mycobacterium bovis AF2122/97 =
  // 233413.5 as the comparison genome).
  //
  // Rerun coverage: `proteome-comparison-service.ts` declares
  // `fields: ["output_path", "output_file", "max_e_val"]` and an `onApply`
  // that converts `min_seq_cov` / `min_ident` back from decimals to
  // percentages, reads `genome_ids` + `reference_genome_index`, and
  // reconstructs `comparison_items`. `publicDataOverrides` stubs
  // `/api/services/genome/by-ids` for the comparison-item lookup.
  const tutorialRerunPayload = {
    output_path: "/e2e-test-user@patricbrc.org/home",
    output_file: "tutorial-proteome",
    max_e_val: "1e-5",
    min_seq_cov: 0.3,
    min_ident: 0.1,
    // genome_ids[0] is the reference (reference_genome_index=1, 1-based);
    // remaining ids become comparison_items of type="genome".
    genome_ids: ["83332.12", "233413.5"],
    reference_genome_index: 1,
  };

  test("submitting in debug mode renders the tutorial-derived params in JobParamsDialog", async ({
    page,
  }) => {
    await applyBackendMocks(page, {
      overrides: [
        ...buildWorkspaceOverrides(),
        ...buildJobsOverrides(),
        ...journeyOverrides,
        // Comparison genomes are rehydrated from rerun via
        // createGenomeComparisonItem — no async lookup in that path, but the
        // reference SingleGenomeSelector on mount fetches via genome/by-ids.
        ...publicDataOverrides,
      ],
    });

    const form = new ServiceFormPage(page, /proteome comparison/i);
    await form.enableDebugMode();
    await form.seedRerun(tutorialRerunPayload);
    await form.goto(
      "/services/proteome-comparison?rerun_key=e2e-rerun",
    );

    // Submit only enables once schema validation passes — requires a
    // reference and at least 1 comparison item, both supplied via rerun.
    await expect(
      page.getByRole("button", { name: /^submit$/i }),
    ).toBeEnabled({ timeout: 10_000 });

    await form.submit(/^submit$/i);

    const params = await form.readSubmittedParams("GenomeComparison");
    expect(params).toMatchObject({
      output_path: "/e2e-test-user@patricbrc.org/home",
      output_file: "tutorial-proteome",
      // transformProteomeComparisonParams puts the reference genome first in
      // genome_ids and sets reference_genome_index=1.
      genome_ids: ["83332.12", "233413.5"],
      reference_genome_index: 1,
      max_e_val: "1e-5",
      // transformParams converts the form's percentage values back into
      // decimals before submission: 30 → 0.3, 10 → 0.1.
      min_seq_cov: 0.3,
      min_ident: 0.1,
    });
  });
});
