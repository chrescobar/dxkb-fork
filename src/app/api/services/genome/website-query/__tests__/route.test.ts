import { POST } from "../route";
import {
  mockNextRequest,
  mockFetchResponse,
} from "@/test-helpers/api-route-helpers";

vi.mock("@/lib/auth", () => ({ getBvbrcAuthToken: vi.fn() }));

vi.mock("csv-parse/sync", () => ({
  parse: vi.fn(() => [{ genome_id: "1", genome_name: "test" }]),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

async function json(res: Response) {
  return res.json();
}

describe("POST /api/services/genome/website-query", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("BVBRC_WEBSITE_API_URL", "http://mock-website-api");
  });

  it("returns 401 when no auth token", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue(undefined);

    const req = mockNextRequest({
      method: "POST",
      body: { genome_ids: ["1.1"] },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(await json(res)).toEqual(
      expect.objectContaining({ error: "Authentication required" }),
    );
  });

  it("returns empty results when genome_ids is empty", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    const req = mockNextRequest({ method: "POST", body: { genome_ids: [] } });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await json(res)).toEqual({ results: [] });
  });

  it("escapes Solr special characters in IDs", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    const jsonHeaders = new Headers({ "content-type": "application/json" });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: jsonHeaders,
      text: () => Promise.resolve(JSON.stringify([])),
    });

    const req = mockNextRequest({
      method: "POST",
      body: { genome_ids: ["test+id"] },
    });
    await POST(req);

    const fetchBody = mockFetch.mock.calls[0][1].body as string;
    // The + should be escaped
    expect(fetchBody).toContain("test%5C%2Bid");
  });

  it("caps rows to maxRows (25000)", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    const jsonHeaders = new Headers({ "content-type": "application/json" });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: jsonHeaders,
      text: () => Promise.resolve(JSON.stringify([])),
    });

    // Create more IDs than maxRows
    const manyIds = Array.from({ length: 30000 }, (_, i) => `${i}`);
    const req = mockNextRequest({
      method: "POST",
      body: { genome_ids: manyIds },
    });
    await POST(req);

    const fetchBody = mockFetch.mock.calls[0][1].body as string;
    const params = new URLSearchParams(fetchBody);
    expect(params.get("rows")).toBe("25000");
  });

  it("returns results from JSON content-type response", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    const genomes = [{ genome_id: "1.1", genome_name: "G1" }];
    const jsonHeaders = new Headers({ "content-type": "application/json" });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: jsonHeaders,
      text: () => Promise.resolve(JSON.stringify(genomes)),
    });

    const req = mockNextRequest({
      method: "POST",
      body: { genome_ids: ["1.1"] },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await json(res)).toEqual({ results: genomes });
  });

  it("returns results from CSV content-type response", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    const csvHeaders = new Headers({ "content-type": "text/csv" });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: csvHeaders,
      text: () => Promise.resolve("genome_id,genome_name\n1,test"),
    });

    const req = mockNextRequest({
      method: "POST",
      body: { genome_ids: ["1"] },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    // csv-parse/sync is mocked to return [{ genome_id: "1", genome_name: "test" }]
    expect(await json(res)).toEqual({
      results: [{ genome_id: "1", genome_name: "test" }],
    });
  });

  it("handles empty CSV response", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    const { parse } = await import("csv-parse/sync");
    vi.mocked(parse).mockReturnValue([]);

    const csvHeaders = new Headers({ "content-type": "text/csv" });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: csvHeaders,
      text: () => Promise.resolve(""),
    });

    const req = mockNextRequest({
      method: "POST",
      body: { genome_ids: ["1"] },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await json(res)).toEqual({ results: [] });
  });

  it("returns upstream error on non-ok response", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");
    mockFetch.mockResolvedValue(mockFetchResponse("err", false, 503));

    const req = mockNextRequest({
      method: "POST",
      body: { genome_ids: ["1.1"] },
    });
    const res = await POST(req);

    expect(res.status).toBe(503);
    expect(await json(res)).toEqual(
      expect.objectContaining({ error: expect.stringContaining("failed") }),
    );
  });

  it("returns 500 on unexpected exception", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");
    mockFetch.mockRejectedValue(new Error("network failure"));

    const req = mockNextRequest({
      method: "POST",
      body: { genome_ids: ["1.1"] },
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(await json(res)).toEqual(
      expect.objectContaining({ error: "Internal server error" }),
    );
  });
});
