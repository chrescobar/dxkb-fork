import { test, expect, applyBackendMocks } from "../../mocks/backends";
import { permissiveBackendOverrides } from "../../fixtures/overrides";

test.use({ storageState: { cookies: [], origins: [] } });

// In E2E, NEXT_PUBLIC_DATA_API=http://127.0.0.1:${E2E_PORT}/api/e2e-mock/data so all
// ppi fetches (count, rows) go through the loopback, not bv-brc.org.
const ppiLoopback = /\/api\/e2e-mock\/data\/ppi\//;
const ppiLoopbackCount = /\/api\/e2e-mock\/data\/ppi\/.*limit/;
const INTERACTIONS_TAXON_ID = "234"; // Brucella - lineage includes Bacteria

function buildPpiRows(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `ppi-${String(i).padStart(4, "0")}`,
    genome_id_a: "224914.16",
    genome_name_a: "Brucella melitensis bv. 1 str. 16M [WGS]",
    interactor_a: `fig|224914.16.peg.${String(600 + i)}`,
    feature_id_a: `PATRIC.224914.16.feature-a-${String(i)}`,
    refseq_locus_tag_a: `BAWG_${String(1000 + i)}`,
    gene_a: "",
    interactor_desc_a: "6,7-dimethyl-8-ribityllumazine synthase",
    genome_id_b: "224914.16",
    genome_name_b: "Brucella melitensis bv. 1 str. 16M [WGS]",
    interactor_b: `fig|224914.16.peg.${String(2400 + i)}`,
    feature_id_b: `PATRIC.224914.16.feature-b-${String(i)}`,
    refseq_locus_tag_b: `BAWG_${String(2000 + i)}`,
    gene_b: "",
    interactor_desc_b: "CrcB protein",
    category: "PPI",
    interaction_type: ["predicted interaction"],
    detection_method: ["predictive text mining"],
    evidence: ["experimental"],
    score: 2.5316925,
  }));
}

test.describe("taxon interactions tab", () => {
  test("renders PPI rows for the bacterial taxon", async ({ page }) => {
    const rows = buildPpiRows(3);

    await applyBackendMocks(page, {
      overrides: [
        { url: ppiLoopbackCount, method: "GET", body: { response: { numFound: 3 } } },
        { url: ppiLoopback, method: "GET", body: rows },
        ...permissiveBackendOverrides,
      ],
    });

    await page.goto(`/taxonomy/${INTERACTIONS_TAXON_ID}?tab=interactions`);
    await expect(page).toHaveURL(/tab=interactions/);
    await expect(page.getByText("Showing 1-3 of 3 results")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("fig|224914.16.peg.600")).toBeVisible();
    await expect(page.getByRole("button", { name: "Interactions" })).toBeVisible();
  });
});
