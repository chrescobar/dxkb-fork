import { NextRequest, NextResponse } from "next/server";

/**
 * Loopback mock for Playwright e2e only.
 *
 * Server components and API route handlers call backends (APP_SERVICE_URL,
 * WORKSPACE_API_URL, USER_URL, ...) at request time. Those outbound fetches
 * never pass through `page.route()`, so without this catch-all the test
 * server emits "HTTP error! status: 500" for every render. During e2e,
 * .env.e2e.test points every backend URL here and this handler returns
 * the shapes the callers expect (empty object for REST, empty JSON-RPC
 * result for POST).
 *
 * Guarded by E2E_MOCK_ENABLED=1 so a production deploy that somehow ships
 * this file still can't be tricked into serving fake backend responses.
 */

function isEnabled(): boolean {
  return process.env.E2E_MOCK_ENABLED === "1";
}

function disabledResponse(): NextResponse {
  return NextResponse.json({ error: "Mock endpoint disabled" }, { status: 404 });
}

function resolvePath(params: Promise<{ path: string[] }>): Promise<string> {
  return params.then((p) => p.path.join("/"));
}

function logHit(method: string, path: string, extra?: string): void {
  const tail = extra ? ` ${extra}` : "";
  console.log(`[api/e2e-mock] ${method} /${path}${tail}`);
}

const e2eDeterministicCounts: Record<string, number> = {
  genome: 12345,
  genome_feature: 67890,
  taxonomy: 23456,
  epitope: 7890,
  protein_structure: 4567,
  protein_feature: 8901,
};

function maybeSolrCount(path: string): { response: { numFound: number; docs: never[] } } | null {
  const segments = path.split("/").filter(Boolean);
  if (segments[0] !== "data" || segments.length < 2) return null;
  const core = segments[1];
  const numFound = e2eDeterministicCounts[core];
  if (typeof numFound !== "number") return null;
  return { response: { numFound, docs: [] } };
}

const bacteriaSummaryFixture = {
  count: 1337420,
  unique_family: 391,
  unique_genus: 5432,
  unique_species: 82915,
  CDS: 482001224,
  mat_peptide: 23144,
  PDB: 9821,
};

const virusesSummaryFixture = {
  count: 890123,
  unique_family: 212,
  unique_genus: 2841,
  unique_species: 14302,
  CDS: 12803441,
  mat_peptide: 419820,
  PDB: 3201,
};

const allOrganismsSummaryFixture = {
  count: 9800000,
  unique_family: 1204,
  unique_genus: 41200,
  unique_species: 510000,
  CDS: 980000000,
  mat_peptide: 450000,
  PDB: 21000,
};

const bacteriaTaxonomyFixture = {
  taxon_id: 2,
  taxon_name: "Bacteria",
  lineage_names: ["cellular organisms", "Bacteria"],
  taxon_rank: "superkingdom",
  genomes: 1337420,
};

const sharedFacetFixtures: Record<string, (string | number)[]> = {
  genus: [
    "Escherichia",
    128450,
    "Klebsiella",
    74231,
    "Streptococcus",
    68814,
    "Mycobacterium",
    55820,
    "Salmonella",
    53994,
    "Staphylococcus",
    47780,
    "Pseudomonas",
    39210,
    "Bacillus",
    35892,
    "Acinetobacter",
    30122,
    "Enterococcus",
    26750,
    "Clostridium",
    23220,
    "Lactobacillus",
    20540,
    "Vibrio",
    18812,
    "Campylobacter",
    16204,
    "Listeria",
    13920,
    "Bordetella",
    11204,
    "Neisseria",
    10772,
    "Corynebacterium",
    10013,
    "Shigella",
    9481,
    "Yersinia",
    8190,
    "Brucella",
    7604,
    "Legionella",
    6901,
    "Francisella",
    5488,
    "Rickettsia",
    4312,
  ],
  host_name: [
    "Homo sapiens",
    401232,
    "Bos taurus",
    88411,
    "Sus scrofa",
    63411,
    "Gallus gallus",
    51003,
    "Mus musculus",
    29110,
    "Environment",
    14420,
  ],
  host_group: [
    "Human",
    512004,
    "Animal",
    231880,
    "Environment",
    98120,
    "Plant",
    41230,
    "Insect",
    29801,
  ],
  isolation_country: [
    "United States",
    290442,
    "China",
    162001,
    "United Kingdom",
    91230,
    "Germany",
    70612,
    "Canada",
    56640,
    "Brazil",
    42801,
  ],
  family: [
    "Coronaviridae",
    180204,
    "Flaviviridae",
    98041,
    "Orthomyxoviridae",
    84312,
    "Paramyxoviridae",
    61203,
    "Retroviridae",
    52810,
    "Rhabdoviridae",
    41002,
    "Herpesviridae",
    38901,
    "Adenoviridae",
    29410,
    "Poxviridae",
    21034,
    "Picornaviridae",
    18920,
  ],
};

function facetFieldFromRequest(request: NextRequest): string | null {
  const url = new URL(request.url);
  const candidates = [
    url.search,
    ...Array.from(url.searchParams.keys()),
    ...Array.from(url.searchParams.values()),
  ].map((value) => { try { return decodeURIComponent(value); } catch { return value; } });

  for (const candidate of candidates) {
    const match = candidate.match(/\(field,([^),=]+)\)/);
    if (match?.[1]) return match[1];
  }

  return null;
}

function solrFacet(field: string, count: number) {
  return {
    response: { numFound: count, docs: [] },
    facet_counts: {
      facet_fields: {
        [field]: sharedFacetFixtures[field] ?? [],
      },
    },
  };
}

function maybeBvBrcWebsite(path: string, request: NextRequest): unknown | null {
  const segments = path.split("/").filter(Boolean);
  if (segments[0] !== "bvbrc-website") return null;
  const endpoint = segments.slice(1).join("/");

  if (endpoint === "data/summary_by_taxon/2") return bacteriaSummaryFixture;
  if (endpoint === "data/summary_by_taxon/10239") return virusesSummaryFixture;
  if (endpoint === "data/summary_by_taxon/131567") return allOrganismsSummaryFixture;
  if (endpoint === "taxonomy/2") return bacteriaTaxonomyFixture;
  if (endpoint === "genome") {
    const field = facetFieldFromRequest(request);
    if (!field) return {};
    const url = new URL(request.url);
    const query = decodeURIComponent(url.search);
    let count = bacteriaSummaryFixture.count;
    if (query.includes("10239")) count = virusesSummaryFixture.count;
    else if (query.includes("131567")) count = allOrganismsSummaryFixture.count;
    return solrFacet(field, count);
  }

  return null;
}


export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  if (!isEnabled()) return disabledResponse();
  const path = await resolvePath(context.params);
  logHit("GET", path);
  const bvBrcWebsite = maybeBvBrcWebsite(path, request);
  if (bvBrcWebsite) return NextResponse.json(bvBrcWebsite);
  const solr = maybeSolrCount(path);
  if (solr) return NextResponse.json(solr);
  return NextResponse.json({});
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  if (!isEnabled()) return disabledResponse();
  const path = await resolvePath(context.params);

  let rpcMethod: string | undefined;
  try {
    const body = (await request.clone().json()) as { method?: unknown } | null;
    if (body && typeof body.method === "string") rpcMethod = body.method;
  } catch {
    // Non-JSON body (e.g. form upload) — fine, just skip method logging.
  }

  logHit("POST", path, rpcMethod ? `method=${rpcMethod}` : "");
  return NextResponse.json({ id: 1, jsonrpc: "2.0", result: [[]] });
}

export async function PUT(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  if (!isEnabled()) return disabledResponse();
  const path = await resolvePath(context.params);
  logHit("PUT", path);
  return NextResponse.json({});
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  if (!isEnabled()) return disabledResponse();
  const path = await resolvePath(context.params);
  logHit("DELETE", path);
  return NextResponse.json({});
}
