import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
  publicDataOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

test.describe("viral-assembly — tutorial walkthrough (debug mode)", () => {
  // Tutorial: https://www.bv-brc.org/docs/tutorial/viral_assembly/assembly.html
  //
  // The BV-BRC Viral Assembly tutorial gives a concrete worked example:
  //   - Input: SRA Run Accession SRR31821206
  //   - Strategy: IRMA (only option)
  //   - Reference module: FLU
  //   - Output name: Assembly_workshop_prep
  // These map to the rerun payload below. The transform stores singular
  // fields (`srr_id` here), and the rerun.fields cover strategy/module/
  // output_path/output_file. The libraries flow through the page-level
  // onApply rerun extension which reads `srr_id` (singular).
  //
  // The submit button label is "Assemble", not "Submit".
  const tutorialRerunPayload = {
    strategy: "irma",
    module: "FLU",
    output_path: "/e2e-test-user@patricbrc.org/home",
    output_file: "Assembly_workshop_prep",
    // The onApply rerun handler keys off paired_end_lib / single_end_lib /
    // srr_id (singular) — matching what transformViralAssemblyParams emits.
    srr_id: "SRR31821206",
  };

  test("submitting in debug mode renders the tutorial-derived params in JobParamsDialog", async ({
    page,
  }) => {
    await applyBackendMocks(page, {
      overrides: [
        ...buildWorkspaceOverrides(),
        ...buildJobsOverrides(),
        ...journeyOverrides,
        // SraRunAccessionWithValidation fires `/api/services/sra-validation`
        // when the rerun-hydrated SRR id is well-formed.
        ...publicDataOverrides,
      ],
    });

    const form = new ServiceFormPage(page, /viral assembly/i);
    await form.enableDebugMode();
    await form.seedRerun(tutorialRerunPayload);
    await form.goto("/services/viral-assembly?rerun_key=e2e-rerun");

    // Submit button is labeled "Assemble" on this service, not "Submit".
    await expect(
      page.getByRole("button", { name: /^assemble$/i }),
    ).toBeEnabled({ timeout: 10_000 });

    await form.submit(/^assemble$/i);

    const params = await form.readSubmittedParams("ViralAssembly");
    expect(params).toMatchObject({
      strategy: "irma",
      module: "FLU",
      output_path: "/e2e-test-user@patricbrc.org/home",
      output_file: "Assembly_workshop_prep",
      srr_id: "SRR31821206",
    });
  });
});
