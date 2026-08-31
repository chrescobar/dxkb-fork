import type { JsonOverride } from "../../mocks/backends";

/**
 * Permissive catch-all mocks for API namespaces that don't have specific fixtures.
 * These apply at the END of any override list (matched first by route LIFO) so more
 * specific overrides registered later override them. Use to keep strict mode happy
 * without explicitly mocking every endpoint a page touches.
 */
const genomeSequenceRows = [
  {
    sequence_id: "1282460.2049.con.0001",
    genome_id: "1282460.2049",
    accession: "JX869059",
    length: 30_119,
  },
];

const genomeFeatureRows = [
  {
    feature_id: "PATRIC.1282460.2049.JX869059.CDS.1.100.fwd",
    patric_id: "fig|1282460.2049.peg.1",
    genome_id: "1282460.2049",
    genome_name: "Middle East respiratory syndrome-related coronavirus isolate",
    taxon_id: 1335626,
    annotation: "PATRIC",
    feature_type: "CDS",
    accession: "JX869059",
    start: 1,
    end: 100,
    strand: "+",
    product: "replicase polyprotein",
    aa_length: 33,
  },
];

const epitopeRows = [
  {
    epitope_id: "15780",
    epitope_type: "Discontinuous peptide",
    epitope_sequence: "A1, C4, D8",
    organism: "Influenza A virus",
    taxon_id: 11520,
    taxon_lineage_ids: [10239, 11520],
    protein_name: "Hemagglutinin",
    protein_accession: "P03452",
    host_name: ["Homo sapiens, human"],
    total_assays: 2,
    assay_results: ["Positive", "Negative"],
    bcell_assays: 2,
    tcell_assays: 0,
    mhc_assays: 0,
    comments: "Discontinuous residues",
    date_inserted: "2024-01-01",
  },
];

const epitopeAssayRows = [
  { assay_id: "A-1", epitope_id: "15780", assay_type: "B cell", assay_method: "ELISA", assay_group: "Antibody", assay_result: "Positive", host_name: "Human", pmid: "123456", title: "Influenza epitope assay", protein_name: "Hemagglutinin", epitope_type: "Discontinuous peptide" },
  { assay_id: "A-2", epitope_id: "15780", assay_type: "B cell", assay_method: "Neutralization", assay_group: "Antibody", assay_result: "Negative", host_name: "Human", pmid: "123456", title: "Influenza epitope assay", protein_name: "Hemagglutinin", epitope_type: "Discontinuous peptide" },
];

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
    url: /\/api\/data\/epitope_assay(?:\?|$)/,
    method: "GET",
    body: { rows: epitopeAssayRows, total: 2, facets: {}, page: 1, pageSize: 200 },
  },
  {
    url: /\/api\/data\/epitope_assay(?:\?|$)/,
    method: "POST",
    body: { rows: epitopeAssayRows },
  },
  {
    url: /\/api\/data\/epitope(?:\?|$)/,
    method: "GET",
    body: {
      rows: epitopeRows,
      total: 1,
      facets: {
        epitope_type: [{ value: "Discontinuous peptide", count: 1 }],
        protein_name: [{ value: "Hemagglutinin", count: 1 }],
        host_name: [{ value: "Human", count: 1 }],
        assay_results: [{ value: "Positive", count: 1 }],
      },
      page: 1,
      pageSize: 200,
    },
  },
  {
    url: /\/api\/data\/epitope(?:\?|$)/,
    method: "POST",
    body: { rows: epitopeRows },
  },
  {
    url: /\/api\/data\/genome_feature(?:\?|$)/,
    method: "GET",
    body: {
      rows: genomeFeatureRows,
      total: 1,
      facets: {
        annotation: [{ value: "PATRIC", count: 1 }],
        feature_type: [{ value: "CDS", count: 1 }],
      },
      page: 1,
      pageSize: 200,
    },
  },
  {
    url: /\/api\/data\/genome_feature(?:\?|$)/,
    method: "POST",
    body: { rows: genomeFeatureRows },
  },
  {
    url: /\/api\/data\/genome_sequence(?:\?|$)/,
    method: "GET",
    body: {
      rows: genomeSequenceRows,
      total: 1,
      facets: {},
      page: 1,
      pageSize: 200,
    },
  },
  {
    url: /\/api\/data\/genome_sequence(?:\?|$)/,
    method: "POST",
    body: { rows: genomeSequenceRows },
  },
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
