// `server-only` throws outside Next's bundler (same neutralization as the Genome Browser route test).
vi.mock("server-only", () => ({}));

import { http, HttpResponse } from "msw";
import { server } from "@/test-helpers/msw-server";
import { json, makeRouteContext, mockNextRequest } from "@/test-helpers/api-route-helpers";
import { GET } from "../route";

let nextIpOctet = 10;

function call(operation: string, query: string) {
  nextIpOctet += 1;
  return GET(
    mockNextRequest({
      url: `http://localhost:3019/api/circular-viewer/${operation}?${query}`,
      headers: { "x-forwarded-for": `203.0.113.${String(nextIpOctet)}` },
    }),
    makeRouteContext({ operation }),
  );
}

function expectPrivateNoStore(response: Response) {
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("Vary")).toBe("Cookie");
}

beforeEach(() => {
  process.env.DATA_API_URL = "https://data.test";
});

afterEach(() => {
  delete process.env.DATA_API_URL;
});

describe("circular viewer route", () => {
  it("answers a genome's sequences, never shared-cached", async () => {
    server.use(
      http.get("https://data.test/genome_sequence/", () =>
        HttpResponse.json([
          { sequence_id: "s1", accession: "NC_000962", length: 4411532, gc_content: 65.61, topology: "circular" },
        ]),
      ),
    );
    const response = await call("contigs", "genomeId=83332.12");
    expect(response.status).toBe(200);
    expectPrivateNoStore(response);
    expect(await json(response)).toEqual({
      contigs: [
        { accession: "NC_000962", sequenceId: "s1", length: 4411532, gcContent: 65.61, topology: "circular" },
      ],
      truncated: false,
    });
  });

  it("answers a specialty-gene track through its features", async () => {
    server.use(
      http.get("https://data.test/sp_gene/", () =>
        HttpResponse.json([
          { id: "a", feature_id: "F1" },
          { id: "b", feature_id: "F1" },
        ]),
      ),
      http.post("https://data.test/genome_feature/", () =>
        HttpResponse.json([
          { feature_id: "F1", accession: "NC_000962", start: 5, end: 50, strand: "-", feature_type: "CDS" },
        ]),
      ),
    );
    const response = await call("track", "genomeId=83332.12&preset=amr");
    expect(await json(response)).toEqual({
      features: [
        { featureId: "F1", accession: "NC_000962", start: 5, end: 50, strand: "-", featureType: "CDS" },
      ],
      truncated: false,
    });
  });

  it("answers GC windows computed from the sequences", async () => {
    server.use(
      http.get("https://data.test/genome_sequence/", () =>
        HttpResponse.json([{ sequence_id: "s1", accession: "A", sequence: "GGCCAATT" }]),
      ),
    );
    const response = await call("gc", "genomeId=1.1");
    expect(await json(response)).toEqual({
      windowSize: 20,
      contigs: [{ accession: "A", length: 8, gc: [0.5], skew: [0] }],
    });
  });

  it("answers 422 genome_too_long for a genome over the GC limit, without downloading its sequences", async () => {
    const requested: string[] = [];
    server.use(
      http.get("https://data.test/genome_sequence/", ({ request }) => {
        requested.push(decodeURIComponent(new URL(request.url).search));
        return HttpResponse.json([{ sequence_id: "s1", accession: "A", length: 30_000_001 }]);
      }),
    );
    const response = await call("gc", "genomeId=1.1");
    expect(response.status).toBe(422);
    expectPrivateNoStore(response);
    const body = await json(response);
    expect(body).toEqual(expect.objectContaining({ code: "genome_too_long" }));
    expect(JSON.stringify(body)).toContain("30,000,001 bp long");
    expect(requested).toHaveLength(1);
    expect(requested[0]).toContain("select(sequence_id,accession,length)");
    expect(requested[0]).not.toContain("sequence)");
  });

  it("still answers 422 when the sequences outgrow lengths that fit", async () => {
    server.use(
      http.get("https://data.test/genome_sequence/", () =>
        HttpResponse.json([{ sequence_id: "s1", accession: "A", sequence: "A".repeat(30_000_001) }]),
      ),
    );
    const response = await call("gc", "genomeId=1.1");
    expect(response.status).toBe(422);
    expect(JSON.stringify(await json(response))).toContain("30,000,001 bp long");
  });

  it("rejects an invalid custom track with the validation message", async () => {
    const response = await call("custom", "genomeId=1.1&type=CDS&strand=both&keyword=%20");
    expect(response.status).toBe(400);
    expectPrivateNoStore(response);
    expect(await json(response)).toEqual({
      error: "keyword must contain a word to search for.",
      code: "invalid_request",
    });
  });

  it("names an unknown operation", async () => {
    const response = await call("sequence", "genomeId=1.1");
    expect(response.status).toBe(404);
    expectPrivateNoStore(response);
    expect(await json(response)).toEqual({
      error: "Unsupported circular viewer operation: sequence",
      code: "not_found",
    });
  });
});
