import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

test.describe("metagenomic-read-mapping — tutorial walkthrough (debug mode)", () => {
  // Tutorial: https://www.bv-brc.org/docs/tutorial/metagenomic_read_mapping/metagenomic_read_mapping.html
  //
  // The BV-BRC metagenomic-read-mapping tutorial is a generic UI walkthrough
  // — no concrete reads, SRA accession, or output name is given. The inputs
  // below pick the simplest canonical path: gene_set_type="predefined_list"
  // with the default CARD database, against a single paired-end library in
  // the test user's workspace.
  //
  // Rerun coverage: `metagenomic-read-mapping-service.ts` declares
  // `fields: ["output_path", "output_file", "gene_set_type", "gene_set_name",
  // "gene_set_fasta", "gene_set_feature_group"]`. The page-level rerun
  // extends with `libraries: ["paired", "single", "sra"]` + `syncLibraries`
  // so the shared library builders hydrate `paired_end_libs` from rerunData.
  const tutorialRerunPayload = {
    output_path: "/e2e-test-user@patricbrc.org/home",
    output_file: "tutorial-mrm",
    gene_set_type: "predefined_list",
    gene_set_name: "CARD",
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
      ],
    });

    const form = new ServiceFormPage(page, /metagenomic read mapping/i);
    await form.enableDebugMode();
    await form.seedRerun(tutorialRerunPayload);
    await form.goto(
      "/services/metagenomic-read-mapping?rerun_key=e2e-rerun",
    );

    // Submit only enables once the schema's "at least one library" rule is
    // satisfied — which confirms the rerun-supplied paired_end_lib was
    // applied via syncLibraries.
    await expect(
      page.getByRole("button", { name: /^submit$/i }),
    ).toBeEnabled({ timeout: 10_000 });

    await form.submit(/^submit$/i);

    const params = await form.readSubmittedParams("MetagenomicReadMapping");
    expect(params).toMatchObject({
      output_path: "/e2e-test-user@patricbrc.org/home",
      output_file: "tutorial-mrm",
      gene_set_type: "predefined_list",
      gene_set_name: "CARD",
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
