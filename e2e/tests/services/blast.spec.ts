import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

test.describe("blast — tutorial walkthrough (debug mode)", () => {
  // Tutorial: https://www.bv-brc.org/docs/tutorial/blast/blast.html
  //
  // The BV-BRC BLAST tutorial is a UI walkthrough rather than a worked
  // example — it lists the input/database options without choosing concrete
  // values. The inputs below pick the most canonical path: a pasted DNA
  // sequence (input_source="fasta_data", input_type="dna"), blastn against
  // the default reference/representative bacteria-archaea precomputed DB.
  //
  // Fields exercised: input_source, input_fasta_data, output_path,
  // output_file. (db_type, db_source, db_precomputed_database,
  // blast_program, blast_max_hits, blast_evalue_cutoff are NOT in
  // `blastService.rerun.fields` and ride on form defaults — see
  // blast-service.ts and defaultBlastFormValues.)
  //
  // BLAST is a multi-flow service (4 programs × 7 database sources × 3
  // input types). This walkthrough covers the canonical blastn/pasted-FASTA
  // path; sub-flow coverage (e.g. blastp against a feature group) is out
  // of scope per the plan's "1 tutorial-faithful test per service" rule.
  const tutorialRerunPayload = {
    input_source: "fasta_data",
    input_fasta_data: ">query\nACGTACGTACGTACGTACGTACGTACGTACGT\n",
    output_path: "/e2e-test-user@patricbrc.org/home",
    output_file: "tutorial-blast",
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

    const form = new ServiceFormPage(page, /blast/i);
    await form.enableDebugMode();
    await form.seedRerun(tutorialRerunPayload);
    await form.goto("/services/blast?rerun_key=e2e-rerun");

    await expect(page.getByRole("button", { name: /^submit$/i })).toBeEnabled();

    await form.submit(/^submit$/i);

    const params = await form.readSubmittedParams("Homology");
    expect(params).toMatchObject({
      input_source: "fasta_data",
      input_fasta_data: ">query\nACGTACGTACGTACGTACGTACGTACGTACGT\n",
      output_path: "/e2e-test-user@patricbrc.org/home",
      output_file: "tutorial-blast",
      // Defaults that always ride along:
      input_type: "dna",
      db_type: "fna",
      db_source: "precomputed_database",
      db_precomputed_database: "bacteria-archaea",
      blast_program: "blastn",
      blast_max_hits: 10,
      // transformBlastParams stringifies the cutoff value
      blast_evalue_cutoff: "0.0001",
    });
  });
});
