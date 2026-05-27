import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

test.describe("viral-genome-tree — tutorial walkthrough (debug mode)", () => {
  // TODO: No dedicated tutorial exists for viral-genome-tree — the closest
  // BV-BRC reference is the gene-protein-tree tutorial
  // (https://www.bv-brc.org/docs/tutorial/genetree/genetree.html). The
  // inputs below mirror form defaults (RAxML / GTR, trim/gap thresholds at
  // 0, DNA models only) with a single representative genome-group sequence
  // in the test user's workspace — enough to satisfy the schema's
  // `sequences.min(1)` rule for a debug-mode preview.
  //
  // Rerun coverage: `viral-genome-tree-service.ts` declares
  // `fields: ["recipe", "substitution_model", "output_path", "output_file"]`.
  // The page-level rerun extends with an `onApply` that copies
  // `trim_threshold`, `gap_threshold`, and `sequences` directly off
  // rerunData via `normalizeToArray`. Pre-filling `sequences` bypasses the
  // `useViralGenomeGroupValidation` round trip that the add-genome-group
  // button would otherwise trigger.
  //
  // NOTE: serviceName is "GeneTree" (shared with gene-protein-tree on the
  // backend) — tree_type="viral_genome" in the submitted payload
  // disambiguates them server-side.
  const tutorialRerunPayload = {
    recipe: "RAxML",
    substitution_model: "GTR",
    output_path: "/e2e-test-user@patricbrc.org/home",
    output_file: "tutorial-viral-tree",
    trim_threshold: 0,
    gap_threshold: 0,
    sequences: [
      {
        filename:
          "/e2e-test-user@patricbrc.org/home/tutorial-genome-group",
        type: "genome_group",
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

    const form = new ServiceFormPage(page, /viral genome tree/i);
    await form.enableDebugMode();
    await form.seedRerun(tutorialRerunPayload);
    await form.goto(
      "/services/viral-genome-tree?rerun_key=e2e-rerun",
    );

    // Submit only enables once the schema's `sequences.min(1)` rule passes
    // — which confirms the rerun-supplied sequence was applied.
    await expect(
      page.getByRole("button", { name: /^submit$/i }),
    ).toBeEnabled({ timeout: 10_000 });

    await form.submit(/^submit$/i);

    const params = await form.readSubmittedParams("GeneTree");
    expect(params).toMatchObject({
      alphabet: "DNA",
      tree_type: "viral_genome",
      recipe: "RAxML",
      substitution_model: "GTR",
      output_path: "/e2e-test-user@patricbrc.org/home",
      output_file: "tutorial-viral-tree",
      trim_threshold: 0,
      gap_threshold: 0,
      sequences: [
        expect.objectContaining({
          filename:
            "/e2e-test-user@patricbrc.org/home/tutorial-genome-group",
          type: "genome_group",
        }),
      ],
    });
  });
});
