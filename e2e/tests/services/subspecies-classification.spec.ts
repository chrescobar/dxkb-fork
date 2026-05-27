import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

test.describe("subspecies-classification — tutorial walkthrough (debug mode)", () => {
  // Tutorial: https://www.bv-brc.org/docs/tutorial/subspecies_classification/subspecies_classification.html
  //
  // The BV-BRC Subspecies Classification tutorial is a generic UI walkthrough —
  // no concrete sequence, virus type, or output name are given. The inputs
  // below use input_source="fasta_file" (a workspace path) so the form's
  // canSubmit flips green without a blur-triggered local FASTA validator
  // running. virus_type="DENGUE" is a representative selection.
  //
  // Fields exercised: input_source, input_fasta_file, virus_type, output_path,
  // output_file (per service rerun.fields).
  const tutorialRerunPayload = {
    input_source: "fasta_file",
    input_fasta_data: "",
    input_fasta_file:
      "/e2e-test-user@patricbrc.org/home/tutorial_dengue_query.fasta",
    virus_type: "DENGUE",
    output_path: "/e2e-test-user@patricbrc.org/home",
    output_file: "tutorial-subspecies",
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

    const form = new ServiceFormPage(page, /subspecies classification/i);
    await form.enableDebugMode();
    await form.seedRerun(tutorialRerunPayload);
    await form.goto("/services/subspecies-classification?rerun_key=e2e-rerun");

    await expect(
      page.getByRole("button", { name: /^submit$/i }),
    ).toBeEnabled({ timeout: 10_000 });

    await form.submit(/^submit$/i);

    const params = await form.readSubmittedParams("SubspeciesClassification");
    expect(params).toMatchObject({
      input_source: "fasta_file",
      input_fasta_file:
        "/e2e-test-user@patricbrc.org/home/tutorial_dengue_query.fasta",
      virus_type: "DENGUE",
      output_path: "/e2e-test-user@patricbrc.org/home",
      output_file: "tutorial-subspecies",
    });
  });
});
