import type { JsonOverride } from "../../mocks/backends";

/**
 * Permissive catch-all mocks for API namespaces that don't have specific fixtures.
 * These apply at the END of any override list (matched first by route LIFO) so more
 * specific overrides registered later override them. Use to keep strict mode happy
 * without explicitly mocking every endpoint a page touches.
 */
const genomeRows = [
  {
    genome_id: "1282460.2049",
    genome_name: "Middle East respiratory syndrome-related coronavirus isolate",
    strain: "MERS-CoV",
    superkingdom: "Viruses",
    genome_status: "Complete",
    genome_quality: "Good",
    genome_length: 30_119,
    contigs: 1,
    cds: 11,
    collection_year: 2012,
    isolation_country: "Saudi Arabia",
    host_common_name: "Human",
    genbank_accessions: ["JX869059"],
    taxon_id: 1335626,
    taxon_lineage_ids: [10239, 1335626],
    taxon_lineage_names: [
      "Viruses",
      "Middle East respiratory syndrome-related coronavirus",
    ],
  },
];

function genomeDataResponse({ parsedBody }: { parsedBody: unknown }) {
  if (
    parsedBody &&
    typeof parsedBody === "object" &&
    "operation" in parsedBody &&
    (parsedBody.operation === "selected" || parsedBody.operation === "export")
  ) {
    return { rows: genomeRows };
  }
  return { rows: genomeRows, total: 1, facets: {}, page: 1, pageSize: 200 };
}

export const apiCatchallOverrides: JsonOverride[] = [
  {
    url: /\/api\/data\/genome(?:\?|$)/,
    method: "GET",
    body: {
      rows: genomeRows,
      total: 1,
      facets: {
        genome_status: [{ value: "Complete", count: 1 }],
        genome_quality: [{ value: "Good", count: 1 }],
      },
      page: 1,
      pageSize: 200,
    },
  },
  {
    url: /\/api\/data\/genome(?:\?|$)/,
    method: "POST",
    body: genomeDataResponse,
  },
  { url: /\/api\/auth\//, method: "GET", body: {} },
  { url: /\/api\/auth\//, method: "POST", body: {} },
  { url: /\/api\/services\//, method: "GET", body: {} },
  { url: /\/api\/services\//, method: "POST", body: { result: [[]] } },
  { url: /\/api\/workspace\//, method: "GET", body: { items: [] } },
  { url: /\/api\/workspace\//, method: "POST", body: {} },
];

// Anchor to scheme + host so these only match outbound requests whose HOST ends in one of the
// domains. Without the anchor, a URL like `http://127.0.0.1:3020/workspace/user@patricbrc.org/home`
// would match `/patricbrc\.org/` and hijack the page navigation itself.
export const externalCatchallOverrides: JsonOverride[] = [
  { url: /^https?:\/\/(?:[a-z0-9-]+\.)*patricbrc\.org(?:[:/]|$)/i, body: {} },
  { url: /^https?:\/\/(?:[a-z0-9-]+\.)*bv-brc\.org(?:[:/]|$)/i, body: {} },
  {
    url: /^https?:\/\/(?:[a-z0-9-]+\.)*theseed\.org(?:[:/]|$)/i,
    body: { result: [[]] },
  },
  {
    url: /^https?:\/\/(?:[a-z0-9-]+\.)*ncbi\.nlm\.nih\.gov(?:[:/]|$)/i,
    body: {},
  },
];

/** Combined catch-all for the quick "I just want the page to render" case. */
export const permissiveBackendOverrides: JsonOverride[] = [
  ...apiCatchallOverrides,
  ...externalCatchallOverrides,
];
