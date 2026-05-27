import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

test.describe("sars-cov2-wastewater-analysis — tutorial walkthrough (debug mode)", () => {
  // Tutorial: https://www.bv-brc.org/docs/tutorial/sars_cov_2_wastewater/sars_cov_2_wastewater.html
  //
  // The BV-BRC SARS-CoV-2 Wastewater tutorial is a generic UI walkthrough —
  // no concrete read files, primer choice, or output name are given. The
  // wastewater service only supports recipe="onecodex"; defaults are
  // primers="ARTIC", primer_version="V5.3.2". A representative paired-end
  // library exercises the libraries pathway alongside the rerun.fields.
  //
  // Fields exercised: recipe, primers, primer_version, output_path,
  // output_file (per service rerun.fields). paired_end_libs flows through
  // the page-level rerun libraries extension.
  const tutorialRerunPayload = {
    recipe: "onecodex",
    primers: "ARTIC",
    primer_version: "V5.3.2",
    output_path: "/e2e-test-user@patricbrc.org/home",
    output_file: "tutorial-wastewater",
    paired_end_libs: [
      {
        read1: "/e2e-test-user@patricbrc.org/home/wastewater_R1.fq",
        read2: "/e2e-test-user@patricbrc.org/home/wastewater_R2.fq",
        sample_id: "tutorial_wastewater_sample",
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

    const form = new ServiceFormPage(page, /sars-cov-?2 wastewater analysis/i);
    await form.enableDebugMode();
    await form.seedRerun(tutorialRerunPayload);
    await form.goto(
      "/services/sars-cov2-wastewater-analysis?rerun_key=e2e-rerun",
    );

    await expect(
      page.getByRole("button", { name: /^submit$/i }),
    ).toBeEnabled({ timeout: 10_000 });

    await form.submit(/^submit$/i);

    const params = await form.readSubmittedParams("SARS2Wastewater");
    expect(params).toMatchObject({
      recipe: "onecodex",
      primers: "ARTIC",
      primer_version: "V5.3.2",
      output_path: "/e2e-test-user@patricbrc.org/home",
      output_file: "tutorial-wastewater",
      paired_end_libs: [
        expect.objectContaining({
          read1: "/e2e-test-user@patricbrc.org/home/wastewater_R1.fq",
          read2: "/e2e-test-user@patricbrc.org/home/wastewater_R2.fq",
          sample_id: "tutorial_wastewater_sample",
          // Transform attaches primers/primer_version onto every library.
          primers: "ARTIC",
          primer_version: "V5.3.2",
        }),
      ],
    });
  });
});
