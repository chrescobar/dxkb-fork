import { test, expect, applyBackendMocks } from "../../mocks/backends";
import {
  buildJobsOverrides,
  buildWorkspaceOverrides,
  journeyOverrides,
  publicDataOverrides,
} from "../../fixtures/overrides";
import { ServiceFormPage } from "../../pages";

test.describe("similar-genome-finder — tutorial walkthrough (debug mode)", () => {
  // Tutorial: https://www.bv-brc.org/docs/tutorial/similar_genome_finder/similar_genome_finder.html
  //
  // The BV-BRC similar-genome-finder tutorial is a generic UI walkthrough —
  // no concrete genome IDs, FASTA files, or numeric thresholds are given.
  // The inputs below pick the genome-id input path with a representative
  // public genome (Mycobacterium tuberculosis H37Rv = 83332.12) and the
  // form's defaults for max_hits/max_pvalue/max_distance/scope.
  //
  // Rerun coverage: `similar-genome-finder-service.ts` declares
  // `fields: ["selectedGenomeId", "fasta_file", "output_path", "output_file"]`
  // and an `onApply` that hydrates max_hits, max_pvalue, max_distance,
  // include_bacterial, include_viral, and scope.
  //
  // IMPORTANT: This service's submit button is "Search" (with a search
  // icon), not "Submit". In debug mode the page bypasses its custom server
  // action (`submitSimilarGenomes`) and calls `runtime.previewOrSubmit` with
  // a `MinhashServicePayload`-shaped object (NOT the standard
  // `transformParams` output), so the dialog JSON has the Minhash-RPC
  // structure: `{ method, params: [input, max_pvalue, max_distance,
  // max_hits, include_reference, include_representative, include_bacterial,
  // include_viral], version, id }`.
  const tutorialRerunPayload = {
    selectedGenomeId: "83332.12",
    fasta_file: "",
    output_path: "/e2e-test-user@patricbrc.org/home",
    output_file: "tutorial-similar-genome",
    // Optional override fields handled by the service's onApply (left at
    // defaults here for the canonical run).
  };

  test("submitting in debug mode renders the tutorial-derived params in JobParamsDialog", async ({
    page,
  }) => {
    await applyBackendMocks(page, {
      overrides: [
        ...buildWorkspaceOverrides(),
        ...buildJobsOverrides(),
        ...journeyOverrides,
        // SingleGenomeSelector resolves the selectedGenomeId via
        // `/api/services/genome/by-ids` to populate its display value;
        // stubbed in publicDataOverrides.
        ...publicDataOverrides,
      ],
    });

    const form = new ServiceFormPage(page, /similar genome finder/i);
    await form.enableDebugMode();
    await form.seedRerun(tutorialRerunPayload);
    await form.goto(
      "/services/similar-genome-finder?rerun_key=e2e-rerun",
    );

    // Submit button is labeled "Search" (with a leading search icon).
    // Scope to the page's main section to avoid colliding with the navbar's
    // site-search button which also has accessible name "Search".
    const submitButton = page
      .locator("section")
      .getByRole("button", { name: /^search$/i });
    await expect(submitButton).toBeEnabled({ timeout: 10_000 });
    await submitButton.click();

    // Debug-mode preview emits the MinhashServicePayload shape.
    const params = await form.readSubmittedParams("SimilarGenomeFinder");
    expect(params).toMatchObject({
      method: "Minhash.compute_genome_distance_for_genome2",
      // params positions: [input, max_pvalue, max_distance, max_hits,
      // include_reference, include_representative, include_bacterial,
      // include_viral]. Defaults: max_pvalue=1, max_distance=1, max_hits=50;
      // scope="reference" → include_reference=1 and
      // include_representative=1; include_bacterial=true → 1; viral=true → 1.
      params: [
        "83332.12",
        1,
        1,
        50,
        1,
        1,
        1,
        1,
      ],
      version: "1.1",
    });
  });
});
