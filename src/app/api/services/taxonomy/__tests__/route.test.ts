import { GET } from "../route";
import {
  mockNextRequest,
  mockFetchResponse,
} from "@/test-helpers/api-route-helpers";

vi.mock("@/lib/env", () => ({
  getRequiredEnv: vi.fn(() => "http://mock-api"),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

async function json(res: Response) {
  return res.json();
}

describe("GET /api/services/taxonomy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not require auth", async () => {
    mockFetch.mockResolvedValue(mockFetchResponse({ taxon_id: 1 }));

    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/taxonomy",
      searchParams: { q: "test" },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    // No 401 even though no auth mock
  });

  it("forwards query params to upstream API", async () => {
    mockFetch.mockResolvedValue(mockFetchResponse([]));

    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/taxonomy",
      searchParams: { q: "escherichia", limit: "10" },
    });
    await GET(req);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/taxonomy?");
    expect(url).toContain("q=escherichia");
    expect(url).toContain("limit=10");
  });

  it("returns data on success", async () => {
    const taxData = [{ taxon_id: 123, taxon_name: "E. coli" }];
    mockFetch.mockResolvedValue(mockFetchResponse(taxData));

    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/taxonomy",
      searchParams: { q: "test" },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(await json(res)).toEqual(taxData);
  });

  it("returns upstream error on non-ok response", async () => {
    mockFetch.mockResolvedValue(mockFetchResponse("err", false, 502));

    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/taxonomy",
      searchParams: { q: "test" },
    });
    const res = await GET(req);

    expect(res.status).toBe(502);
    expect(await json(res)).toEqual(
      expect.objectContaining({
        error: expect.stringContaining("Taxonomy API error"),
      }),
    );
  });

  it("returns 500 on unexpected exception", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));

    const req = mockNextRequest({
      url: "http://localhost:3019/api/services/taxonomy",
      searchParams: { q: "test" },
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
    expect(await json(res)).toEqual(
      expect.objectContaining({ error: "Internal server error" }),
    );
  });
});
