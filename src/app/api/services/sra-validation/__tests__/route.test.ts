import { GET } from "../route";
import { mockNextRequest } from "@/test-helpers/api-route-helpers";

vi.mock("@/lib/env", () => ({
  getRequiredEnv: vi.fn(() => "http://mock-ncbi"),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

async function json(res: Response) {
  return res.json();
}

describe("GET /api/services/sra-validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when accession is missing", async () => {
    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/sra-validation",
    });
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(await json(res)).toEqual(
      expect.objectContaining({ error: "accession parameter is required" }),
    );
  });

  it("returns 400 for invalid accession format", async () => {
    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/sra-validation",
      searchParams: { accession: "INVALID" },
    });
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(await json(res)).toEqual(
      expect.objectContaining({
        error: expect.stringContaining("Invalid accession format"),
      }),
    );
  });

  it("returns 400 for accession with wrong pattern (numbers first)", async () => {
    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/sra-validation",
      searchParams: { accession: "123SRR" },
    });
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it("returns success with XML text on valid response", async () => {
    const xmlText = "<xml>valid</xml>";
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(xmlText),
    });

    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/sra-validation",
      searchParams: { accession: "SRR123456" },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(await json(res)).toEqual({ success: true, xml: xmlText });
  });

  it("returns accession-not-valid error on NCBI 4xx", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/sra-validation",
      searchParams: { accession: "SRR999999" },
    });
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(await json(res)).toEqual(
      expect.objectContaining({
        error: expect.stringContaining("not valid"),
      }),
    );
  });

  it("returns NCBI error status on 5xx", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });

    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/sra-validation",
      searchParams: { accession: "SRR123456" },
    });
    const res = await GET(req);

    expect(res.status).toBe(503);
    expect(await json(res)).toEqual(
      expect.objectContaining({
        error: expect.stringContaining("NCBI API error"),
      }),
    );
  });

  it("returns success with timeout flag on AbortError", async () => {
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";
    mockFetch.mockRejectedValue(abortError);

    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/sra-validation",
      searchParams: { accession: "SRR123456" },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(await json(res)).toEqual(
      expect.objectContaining({
        success: true,
        timeout: true,
        accession: "SRR123456",
      }),
    );
  });

  it("returns 500 on other errors", async () => {
    mockFetch.mockRejectedValue(new Error("network failure"));

    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/sra-validation",
      searchParams: { accession: "SRR123456" },
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
    expect(await json(res)).toEqual(
      expect.objectContaining({ error: "network failure" }),
    );
  });
});
