import { test, expect, applyBackendMocks, type JsonOverride } from "../../mocks/backends";
import { permissiveBackendOverrides } from "../../fixtures/overrides";

test.use({ storageState: { cookies: [], origins: [] } });

// Force the strain data API to return 500 so we can assert the error-handling path.
const strainApi500: JsonOverride = {
  url: /\/api\/e2e-mock\/data\/strain\//,
  method: "GET",
  status: 500,
  body: { error: "Internal Server Error" },
};

// Taxon 11520 = Influenza A virus (Orthomyxoviridae). hasStrains predicate requires
// "Orthomyxoviridae" in lineage_names — bacteria like taxon 234 (Brucella) evaluate
// false and the Strains tab is disabled, so the ListData component never mounts.
const INFLUENZA_TAXON_ID = "11520";

test.describe("taxon strains tab: data API error handling", () => {
  test.beforeEach(async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [strainApi500, ...permissiveBackendOverrides],
    });
  });

  test("shows error in table body and keeps all controls visible when data API returns 500", async ({ page }) => {
    await page.goto(`/taxonomy/${INFLUENZA_TAXON_ID}?tab=strains`);

    // Error message must appear in the table body (not replace the whole page).
    await expect(page.getByText(/Failed to fetch metadata/)).toBeVisible({ timeout: 10_000 });

    // HTTP status code must be included in the error message.
    await expect(page.getByText(/500/)).toBeVisible();

    // Table toolbar controls must remain visible (proves the page wasn't replaced by a bare error div).
    await expect(page.getByRole("button", { name: /Download \(CSV\)/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Columns/i })).toBeVisible();

    // Navigation sidebar must still be present.
    await expect(page.getByRole("button", { name: "Strains" })).toBeVisible();
  });
});

// ─── Download Selected: POST regression ───────────────────────────────────────
// Regression: the download-selected handler sent a GET with all IDs in the URL.
// With 200 rows, the URL exceeded browser limits → net::ERR_FAILED.
// Fix: POST with the RQL query in the request body.

const DOMAINS_TAXON_ID = "11974"; // Caliciviridae — has protein_feature (domains-and-motifs) data

function buildProteinFeatureRows(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `mock-pf-${String(i).padStart(4, "0")}`,
    patric_id: `fig|1.${String(i)}.CDS.1`,
    refseq_locus_tag: `gp${String(i)}`,
    gene: `ORF${String(i)}`,
    product: `mock-product-${String(i)}`,
    source: "Pfam",
    source_id: "PF001",
    interpro_description: "mock domain",
    e_value: "1E-10",
    evidence: "InterProScan",
    date_inserted: "2021-07-27",
  }));
}

// In E2E, NEXT_PUBLIC_DATA_API=http://127.0.0.1:${E2E_PORT}/api/e2e-mock/data so all
// protein_feature fetches (count, rows, download POST) go through the loopback, not bv-brc.org.
const pfLoopback = /\/api\/e2e-mock\/data\/protein_feature\//;
const pfLoopbackCount = /\/api\/e2e-mock\/data\/protein_feature\/.*limit\(1\)/;

test.describe("taxon domains-and-motifs: Download Selected sends POST not GET", () => {
  test("sends POST with RQL query in body, not GET params in URL", async ({ page }) => {
    const rows = buildProteinFeatureRows(3);

    await applyBackendMocks(page, {
      overrides: [
        // Count request (&limit(1) in URL) → solr numFound drives totalItems
        { url: pfLoopbackCount, method: "GET", body: { response: { numFound: 3 } } },
        // Data request → table rows (array; ListData parses it directly)
        { url: pfLoopback, method: "GET", body: rows },
        // Download-selected POST → rows so handleDownload can build the CSV
        { url: pfLoopback, method: "POST", body: rows },
        ...permissiveBackendOverrides,
      ],
    });

    // Arm capture BEFORE interaction — waitForRequest resolves when browser initiates it
    const postReqPromise = page.waitForRequest(
      (req) => pfLoopback.test(req.url()) && req.method() === "POST",
    );

    await page.goto(`/taxonomy/${DOMAINS_TAXON_ID}?tab=domains-and-motifs`);
    await expect(page.getByText("mock-product-0")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("checkbox", { name: /select all on this page/i }).click();
    await expect(page.getByRole("button", { name: /Download Selected \(CSV\)/i })).toBeVisible();

    await page.getByRole("button", { name: /Download Selected \(CSV\)/i }).click();

    const postReq = await postReqPromise;
    expect(postReq.method()).toBe("POST");

    // RQL query must be in the body — the URL itself must be clean (no query params)
    const body = postReq.postData() ?? "";
    expect(body).toMatch(/^or\(eq\(id,/);
    expect(postReq.url()).not.toContain("or(eq(id,");
  });

  test("200-row selection succeeds via POST (regression: GET caused net::ERR_FAILED)", async ({ page }) => {
    const rows = buildProteinFeatureRows(200);

    await applyBackendMocks(page, {
      overrides: [
        { url: pfLoopbackCount, method: "GET", body: { response: { numFound: 200 } } },
        { url: pfLoopback, method: "GET", body: rows },
        { url: pfLoopback, method: "POST", body: rows },
        ...permissiveBackendOverrides,
      ],
    });

    const postReqPromise = page.waitForRequest(
      (req) => pfLoopback.test(req.url()) && req.method() === "POST",
    );

    await page.goto(`/taxonomy/${DOMAINS_TAXON_ID}?tab=domains-and-motifs`);
    await expect(page.getByText("mock-product-0")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("checkbox", { name: /select all on this page/i }).click();
    await page.getByRole("button", { name: /Download Selected \(CSV\)/i }).click();

    // This request would have been net::ERR_FAILED as a GET (URL too long for 200 IDs)
    const postReq = await postReqPromise;
    expect(postReq.method()).toBe("POST");

    const body = postReq.postData() ?? "";
    // First and last of the 200 IDs must be present — GET truncation would have lost some
    expect(body).toContain("mock-pf-0000");
    expect(body).toContain("mock-pf-0199");
  });
});
