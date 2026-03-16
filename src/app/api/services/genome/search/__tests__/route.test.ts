import { GET } from "../route";
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

describe("GET /api/services/genome/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no auth token", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue(undefined);

    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/genome/search",
      searchParams: { q: "test" },
    });
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(await json(res)).toEqual(
      expect.objectContaining({ error: "Authentication required" }),
    );
  });

  it("returns all genomes (no wildcard filter) when query is blank", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");
    mockFetch.mockResolvedValue(mockFetchResponse([]));

    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/genome/search",
      searchParams: { q: "" },
    });
    await GET(req);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).not.toContain("genome_name,*");
    expect(url).toContain("or(eq(public,true),eq(public,false))");
  });

  it("sanitizes special characters from query", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");
    mockFetch.mockResolvedValue(mockFetchResponse([]));

    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/genome/search",
      searchParams: { q: "test@#$123" },
    });
    await GET(req);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("*test123*");
  });

  it("returns empty results when query is only special chars (sanitized to empty)", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/genome/search",
      searchParams: { q: "@#$%^" },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(await json(res)).toEqual({ results: [] });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("clamps limit to 1-50 range with default 25", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");
    mockFetch.mockResolvedValue(mockFetchResponse([]));

    // Default limit
    const req1 = mockNextRequest({
      url: "http://localhost:3019/api/services/genome/search",
      searchParams: { q: "test" },
    });
    await GET(req1);
    expect(mockFetch.mock.calls[0][0]).toContain("limit(25)");

    mockFetch.mockClear();

    // Below min
    const req2 = mockNextRequest({
      url: "http://localhost:3019/api/services/genome/search",
      searchParams: { q: "test", limit: "0" },
    });
    await GET(req2);
    expect(mockFetch.mock.calls[0][0]).toContain("limit(1)");

    mockFetch.mockClear();

    // Above max
    const req3 = mockNextRequest({
      url: "http://localhost:3019/api/services/genome/search",
      searchParams: { q: "test", limit: "100" },
    });
    await GET(req3);
    expect(mockFetch.mock.calls[0][0]).toContain("limit(50)");
  });

  it("wraps sanitized query with wildcards", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");
    mockFetch.mockResolvedValue(mockFetchResponse([]));

    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/genome/search",
      searchParams: { q: "ecoli" },
    });
    await GET(req);

    expect(mockFetch.mock.calls[0][0]).toContain("*ecoli*");
  });

  it("returns results on success", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    const genomes = [{ genome_id: "1.1", genome_name: "E. coli" }];
    mockFetch.mockResolvedValue(mockFetchResponse(genomes));

    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/genome/search",
      searchParams: { q: "ecoli" },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(await json(res)).toEqual({ results: genomes });
  });

  it("handles {items} wrapper response", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    const genomes = [{ genome_id: "2.2" }];
    mockFetch.mockResolvedValue(mockFetchResponse({ items: genomes }));

    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/genome/search",
      searchParams: { q: "test" },
    });
    const res = await GET(req);

    expect(await json(res)).toEqual({ results: genomes });
  });

  it("returns upstream error status on non-ok response", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");
    mockFetch.mockResolvedValue(mockFetchResponse("error", false, 503));

    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/genome/search",
      searchParams: { q: "test" },
    });
    const res = await GET(req);

    expect(res.status).toBe(503);
    expect(await json(res)).toEqual(
      expect.objectContaining({ error: expect.stringContaining("failed") }),
    );
  });
});
