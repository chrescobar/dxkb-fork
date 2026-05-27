import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

test.describe("influenza-ha-subtype — tutorial walkthrough (debug mode)", () => {
  // Tutorial: https://www.bv-brc.org/docs/tutorial/ha_numbering/ha_numbering.html
  //
  // The BV-BRC HA Subtype Numbering Conversion tutorial page could not be
  // fetched at write time (auto-fetch blocked); the spec falls back to a
  // representative path. Uses input_source="fasta_file" (a workspace path)
  // instead of pasted FASTA — pasted FASTA gates Submit on a blur-triggered
  // local `isFastaValid` state that never fires under rerun pre-fill.
  // types=["H1N1pdm"] matches defaultInfluenzaHaSubtypeFormValues.
  //
  // Fields exercised: input_source, input_fasta_file, output_path,
  // output_file (per service rerun.fields). types is hydrated by the
  // onApply rerun extension.
  const tutorialRerunPayload = {
    input_source: "fasta_file",
    input_fasta_data: "",
    input_fasta_file:
      "/e2e-test-user@patricbrc.org/home/tutorial_ha_protein.fasta",
    input_feature_group: "",
    output_path: "/e2e-test-user@patricbrc.org/home",
    output_file: "tutorial-ha-subtype",
    types: ["H1N1pdm"],
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

    const form = new ServiceFormPage(page, /ha subtype numbering/i);
    await form.enableDebugMode();
    await form.seedRerun(tutorialRerunPayload);
    await form.goto("/services/influenza-ha-subtype?rerun_key=e2e-rerun");

    await expect(
      page.getByRole("button", { name: /^submit$/i }),
    ).toBeEnabled({ timeout: 10_000 });

    await form.submit(/^submit$/i);

    const params = await form.readSubmittedParams(
      "HASubtypeNumberingConversion",
    );
    expect(params).toMatchObject({
      input_source: "fasta_file",
      input_fasta_file:
        "/e2e-test-user@patricbrc.org/home/tutorial_ha_protein.fasta",
      output_path: "/e2e-test-user@patricbrc.org/home",
      output_file: "tutorial-ha-subtype",
      types: ["H1N1pdm"],
    });
  });
});
