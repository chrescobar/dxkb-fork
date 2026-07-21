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

// ─── "Downloading..." indicator on the plain Download buttons ────────────────
// Regression: the plain Download (CSV)/(TXT) buttons route through ListData's
// onDownloadAll (every ListData instance wires it), and DataTable fired that
// callback without awaiting it — clearing the "Downloading..." state before the
// fetch/blob work finished. Selected-row downloads (bounded page fetch, real
// .finally()) never hit this path, so they never regressed. A slow backend
// response is required to observe the transient state; this delays the
// page-data GET (the request onDownloadAll re-issues) by 500ms.
test.describe("taxon domains-and-motifs: 'Downloading...' indicator on Download (CSV)", () => {
  test("shows 'Downloading...' while the download fetch is in flight, then reverts", async ({ page }) => {
    const rows = buildProteinFeatureRows(3);

    await applyBackendMocks(page, {
      overrides: [
        { url: pfLoopbackCount, method: "GET", body: { response: { numFound: 3 } } },
        { url: pfLoopback, method: "GET", body: rows },
        ...permissiveBackendOverrides,
      ],
    });

    // Registered after applyBackendMocks so it wins (routes are LIFO) and delays
    // only the row-data GET the Download (CSV) button re-issues via handleDownloadAll.
    // Must fall through the &limit(1) count request — pfLoopback matches both, and
    // delaying/misshaping the count response would zero out totalItems and block
    // the initial page-data fetch entirely (enabled: totalItems > 0).
    await page.route(pfLoopback, async (route) => {
      const url = route.request().url();
      if (route.request().method() !== "GET" || pfLoopbackCount.test(url)) return route.fallback();
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(rows),
      });
    });

    await page.goto(`/taxonomy/${DOMAINS_TAXON_ID}?tab=domains-and-motifs`);
    await expect(page.getByText("mock-product-0")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: /^Download \(CSV\)$/i }).click();

    await expect(page.getByText("Downloading...")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Download \(TXT\)$/i })).toBeDisabled();

    await expect(page.getByText("Downloading...")).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /^Download \(CSV\)$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Download \(TXT\)$/i })).toBeEnabled();
  });
});

// ─── Facet click regression: multi-word eq() values must be quoted ───────────
// Regression: buildRql() (src/components/filterbar/filter-utils.ts) built eq()
// clauses with unquoted values. Solr string fields (e.g. epitope_type) split an
// unquoted multi-word value into separate ANDed terms —
// `eq(epitope_type,Linear peptide)` becomes `epitope_type:Linear AND
// epitope_type:peptide`, matching nothing — so clicking any multi-word facet
// value hung the table at "Showing 0-0 of 0 results" forever. Fix: quote eq()
// values. buildRql() is shared by every resource's FilterBar (genome, strain,
// epitope, surveillance, ...), so this one test on the epitope tab exercises
// the fix for all views — the bug and the fix live in one shared function.
const epitopeLoopback = /\/api\/e2e-mock\/data\/epitope\//;

function buildEpitopeRows(count: number, epitopeType: string) {
  return Array.from({ length: count }, (_, i) => ({
    epitope_id: 100000 + i,
    epitope_type: epitopeType,
    epitope_sequence: `SEQ${String(i)}`,
    organism: "Influenza A virus",
    protein_name: "Nucleoprotein",
    total_assays: 1,
    date_inserted: "2021-09-20",
  }));
}

test.describe("taxon epitopes tab: facet click with a multi-word value", () => {
  test("clicking a multi-word Epitope Type facet value returns matching rows, not an empty table", async ({ page }) => {
    await applyBackendMocks(page, { overrides: [...permissiveBackendOverrides] });

    // Fakes a minimal Solr backend for the epitope resource, distinguishing the
    // three request shapes ListData + FacetPanel issue: facet query (has
    // "facet("), count query (bare "limit(1)"), and page-data query (has
    // "select("). Only a correctly quoted phrase match
    // (`eq(epitope_type,"Linear peptide")`) is treated as a hit — an unquoted
    // value (the regression) must NOT match, which is what makes this test
    // catch the bug coming back.
    await page.route(epitopeLoopback, async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      const decoded = decodeURIComponent(route.request().url());

      const hasEpitopeTypeEq = decoded.includes("eq(epitope_type,");
      const hasQuotedPhrase = decoded.includes('eq(epitope_type,"Linear peptide")');
      const matches = !hasEpitopeTypeEq || hasQuotedPhrase;
      const numFound = matches ? (hasEpitopeTypeEq ? 3 : 10) : 0;

      if (decoded.includes("facet(")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            response: { numFound },
            facet_counts: {
              facet_fields: {
                epitope_type: matches ? ["Linear peptide", 10, "Discontinuous peptide", 2] : [],
                protein_name: [],
                host_name: [],
                assay_results: [],
              },
            },
          }),
        });
        return;
      }

      if (decoded.includes("limit(1)")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ response: { numFound } }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(matches ? buildEpitopeRows(numFound, "Linear peptide") : []),
      });
    });

    await page.goto(`/taxonomy/${INFLUENZA_TAXON_ID}?tab=epitopes`);
    await expect(page.getByText("SEQ0")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Show Filters" }).click();
    await page.getByRole("button", { name: /^Linear peptide \(/ }).click();

    // The regression hangs here forever at "Showing 0-0 of 0 results" — assert the
    // real match count instead, proving the request carried a quoted phrase value.
    await expect(page.getByText(/Showing 1-3 of 3 results/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Showing 0-0 of 0 results/)).not.toBeVisible();
  });
});
