import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

test.describe("gene-protein-tree — tutorial walkthrough (debug mode)", () => {
  // Tutorial: https://www.bv-brc.org/docs/tutorial/genetree/genetree.html
  //
  // The BV-BRC gene/protein-tree tutorial is a generic UI walkthrough —
  // no concrete sequence file, recipe choice, or substitution model is
  // given. The inputs below use the default DNA alphabet + RAxML / GTR
  // recipe with a single representative feature_group sequence in the test
  // user's workspace.
  //
  // Rerun coverage: `gene-protein-tree-service.ts` declares
  // `fields: ["recipe", "substitution_model", "output_path", "output_file"]`.
  // The page-level rerun extends with an `onApply` that copies `alphabet`,
  // `trim_threshold`, `gap_threshold`, `sequences`, and metadata field
  // arrays off rerunData via `normalizeToArray`.
  //
  // NOTE: serviceName is "GeneTree" (shared with viral-genome-tree on the
  // backend) — tree_type="gene" in the submitted payload disambiguates
  // them server-side.
  const tutorialRerunPayload = {
    alphabet: "DNA",
    recipe: "RAxML",
    substitution_model: "GTR",
    output_path: "/e2e-test-user@patricbrc.org/home",
    output_file: "tutorial-gene-tree",
    trim_threshold: 0,
    gap_threshold: 0,
    sequences: [
      {
        filename:
          "/e2e-test-user@patricbrc.org/home/tutorial-feature-group",
        type: "feature_group",
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

    // Page heading is "Gene / Protein Tree" (with surrounding spaces around
    // the slash) — match leniently with a regex that ignores spacing.
    const form = new ServiceFormPage(page, /gene\s*\/\s*protein tree/i);
    await form.enableDebugMode();
    await form.seedRerun(tutorialRerunPayload);
    await form.goto("/services/gene-protein-tree?rerun_key=e2e-rerun");

    // Submit only enables once the schema's `sequences.min(1)` rule passes
    // — which confirms the rerun-supplied sequence was applied.
    await expect(
      page.getByRole("button", { name: /^submit$/i }),
    ).toBeEnabled({ timeout: 10_000 });

    await form.submit(/^submit$/i);

    const params = await form.readSubmittedParams("GeneTree");
    expect(params).toMatchObject({
      alphabet: "DNA",
      tree_type: "gene",
      recipe: "RAxML",
      substitution_model: "GTR",
      output_path: "/e2e-test-user@patricbrc.org/home",
      output_file: "tutorial-gene-tree",
      trim_threshold: 0,
      gap_threshold: 0,
      sequences: [
        expect.objectContaining({
          filename:
            "/e2e-test-user@patricbrc.org/home/tutorial-feature-group",
          type: "feature_group",
        }),
      ],
    });
  });
});
