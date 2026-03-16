import { POST } from "../route";
import {
  mockNextRequest,
  mockFetchResponse,
} from "@/test-helpers/api-route-helpers";

vi.mock("@/lib/auth", () => ({ getBvbrcAuthToken: vi.fn() }));
vi.mock("@/lib/env", () => ({
  getRequiredEnv: vi.fn(() => "http://mock-api"),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

async function json(res: Response) {
  return res.json();
}

describe("POST /api/services/genome/validate-viral", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("returns empty results when all IDs are invalid", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    const req = mockNextRequest({
      method: "POST",
      body: { genome_ids: ["abc", "xyz"] },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await json(res)).toEqual({ results: [] });
  });

  it("sanitizes IDs to digits and dots only", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");
    mockFetch.mockResolvedValue(mockFetchResponse([]));

    const req = mockNextRequest({
      method: "POST",
      body: { genome_ids: ["123.45", "abc", "67.89"] },
    });
    await POST(req);

    expect(mockFetch.mock.calls[0][0]).toContain("in(genome_id,(123.45,67.89))");
  });

  it("selects viral-specific fields", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");
    mockFetch.mockResolvedValue(mockFetchResponse([]));

    const req = mockNextRequest({
      method: "POST",
      body: { genome_ids: ["1.1"] },
    });
    await POST(req);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("select(genome_id,superkingdom,genome_length,contigs)");
  });

  it("sets limit to Math.min(ids.length, 5000)", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");
    mockFetch.mockResolvedValue(mockFetchResponse([]));

    const req = mockNextRequest({
      method: "POST",
      body: { genome_ids: ["1.1", "2.2", "3.3"] },
    });
    await POST(req);

    expect(mockFetch.mock.calls[0][0]).toContain("limit(3)");
  });

  it("returns results on success", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    const results = [
      { genome_id: "1.1", superkingdom: "Viruses", genome_length: 30000, contigs: 1 },
    ];
    mockFetch.mockResolvedValue(mockFetchResponse(results));

    const req = mockNextRequest({
      method: "POST",
      body: { genome_ids: ["1.1"] },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await json(res)).toEqual({ results });
  });

  it("returns upstream error on non-ok response", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");
    mockFetch.mockResolvedValue(mockFetchResponse("err", false, 500));

    const req = mockNextRequest({
      method: "POST",
      body: { genome_ids: ["1.1"] },
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(await json(res)).toEqual(
      expect.objectContaining({ error: expect.stringContaining("validation failed") }),
    );
  });
});
