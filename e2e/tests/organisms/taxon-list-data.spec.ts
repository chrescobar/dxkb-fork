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

test.describe("taxon data table: checkbox-column selection", () => {
  test("clicking the cell edge toggles rows additively and keeps checkboxes in sync", async ({ page }) => {
    const rows = buildProteinFeatureRows(3);
    await applyBackendMocks(page, {
      overrides: [...permissiveBackendOverrides],
    });
    await page.route("**/*", async (route) => {
      const request = route.request();
      if (
        request.method() !== "GET" ||
        !request.url().includes("/protein_feature/")
      ) {
        return route.fallback();
      }
      const isPageRequest = decodeURIComponent(request.url()).includes("select(");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          isPageRequest ? rows : { response: { numFound: rows.length } },
        ),
      });
    });

    await page.goto(`/taxonomy/${DOMAINS_TAXON_ID}?tab=domains-and-motifs`);
    await expect(page.getByText("mock-product-0")).toBeVisible({ timeout: 10_000 });

    const first = page.getByRole("checkbox", { name: "Select row mock-pf-0000" });
    const second = page.getByRole("checkbox", { name: "Select row mock-pf-0001" });
    const firstCell = first.locator("xpath=ancestor::td");
    const secondCell = second.locator("xpath=ancestor::td");

    await firstCell.click({ position: { x: 2, y: 12 } });
    await secondCell.click({ position: { x: 2, y: 12 } });
    await expect(first).toBeChecked();
    await expect(second).toBeChecked();

    await firstCell.click({ position: { x: 2, y: 12 } });
    await expect(first).not.toBeChecked();
    await expect(second).toBeChecked();
  });
});

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

    await page.getByRole("checkbox", { name: /select all rows on this page/i }).click();
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

    await page.getByRole("checkbox", { name: /select all rows on this page/i }).click();
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
const epitopeGateway = /\/api\/data\/epitope(?:\?|$)/;

function buildEpitopeRows(count: number, epitopeType: string) {
  return Array.from({ length: count }, (_, i) => ({
    epitope_id: String(100000 + i),
    epitope_type: epitopeType,
    epitope_sequence: `SEQ${String(i)}`,
    organism: "Influenza A virus",
    protein_name: "Nucleoprotein",
    total_assays: 1,
    date_inserted: "2021-09-20",
  }));
}

test.describe("taxon collection tabs: local keyword filtering", () => {
  for (const { tab, keyword, rowText, requestPattern, rows } of [
    {
      tab: "genomes",
      keyword: "Middle East",
      rowText: "Middle East respiratory syndrome-related coronavirus isolate",
      requestPattern: /\/api\/data\/genome(?:\?|$)/,
    },
    {
      tab: "features",
      keyword: "replicase",
      rowText: "replicase polyprotein",
      requestPattern: /\/api\/data\/genome_feature(?:\?|$)/,
      rows: [
        { feature_id: "feature-1", patric_id: "fig|1.1.peg.1", genome_id: "1.1", genome_name: "Fixture genome", feature_type: "CDS", product: "replicase polyprotein" },
        { feature_id: "feature-2", patric_id: "fig|1.1.peg.2", genome_id: "1.1", genome_name: "Fixture genome", feature_type: "CDS", product: "capsid protein" },
      ],
    },
  ]) {
    test(`filters loaded ${tab} rows without changing navbar, URL, or requests`, async ({ page }) => {
      await applyBackendMocks(page, { overrides: [...permissiveBackendOverrides] });
      const collectionRequests: string[] = [];
      page.on("request", (request) => {
        if (requestPattern.test(request.url())) collectionRequests.push(request.url());
      });
      if (rows) {
        await page.route(requestPattern, async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              rows,
              total: rows.length,
              facets: {},
              page: 1,
              pageSize: 200,
            }),
          });
        });
      }

      await page.goto(`/taxonomy/${INFLUENZA_TAXON_ID}?tab=${tab}`);
      await expect(page.getByText(rowText).first()).toBeVisible({ timeout: 10_000 });
      const requestCount = collectionRequests.length;

      await page.getByPlaceholder("Search keywords...").fill(keyword);
      await expect(page.getByText(/Showing 1-1 of 1 results/)).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Search by virus name, protein, gene, or taxonomy..." })).toHaveValue("");
      await expect(page).toHaveURL(`/taxonomy/${INFLUENZA_TAXON_ID}?tab=${tab}`);
      expect(collectionRequests).toHaveLength(requestCount);
    });
  }
});

test.describe("taxon epitopes tab: local filtering and facets", () => {
  test("filters loaded rows without changing the navbar search or URL", async ({ page }) => {
    await applyBackendMocks(page, { overrides: [...permissiveBackendOverrides] });
    const collectionRequests: string[] = [];
    page.on("request", (request) => {
      if (epitopeGateway.test(request.url())) collectionRequests.push(request.url());
    });

    await page.goto(`/taxonomy/${INFLUENZA_TAXON_ID}?tab=epitopes`);
    await expect(page.getByText("Hemagglutinin").first()).toBeVisible({ timeout: 10_000 });
    const requestCount = collectionRequests.length;

    await page.getByPlaceholder("Search keywords...").fill("hemag");
    await expect(page.getByText(/Showing 1-1 of 1 results/)).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Search by virus name, protein, gene, or taxonomy..." })).toHaveValue("");
    await expect(page).toHaveURL(`/taxonomy/${INFLUENZA_TAXON_ID}?tab=epitopes`);
    expect(collectionRequests).toHaveLength(requestCount);
  });

  test("clicking a multi-word Epitope Type facet value returns matching rows, not an empty table", async ({ page }) => {
    await applyBackendMocks(page, { overrides: [...permissiveBackendOverrides] });

    // The gateway exposes one combined rows/count/facets response. Only a
    // correctly quoted phrase predicate is treated as a hit so this remains a
    // regression test for typed RQL serialization.
    await page.route(epitopeGateway, async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      const decoded = decodeURIComponent(route.request().url());
      const hasEpitopeTypeEq = decoded.includes("eq(epitope_type,");
      const hasQuotedPhrase = decoded.includes('eq(epitope_type,"Linear%20peptide")');
      const matches = !hasEpitopeTypeEq || hasQuotedPhrase;
      const total = matches ? (hasEpitopeTypeEq ? 3 : 10) : 0;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          rows: matches ? buildEpitopeRows(total, "Linear peptide") : [],
          total,
          facets: {
            epitope_type: matches
              ? [
                  { value: "Linear peptide", count: 10 },
                  { value: "Discontinuous peptide", count: 2 },
                ]
              : [],
            protein_name: [],
            host_name: [],
            assay_results: [],
          },
          page: 1,
          pageSize: 200,
        }),
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
