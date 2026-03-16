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

describe("POST /api/services/feature/from-group", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no auth token", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue(undefined);

    const req = mockNextRequest({
      method: "POST",
      body: { feature_group_path: "/path/to/group" },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(await json(res)).toEqual(
      expect.objectContaining({ error: "Authentication required" }),
    );
  });

  it("returns empty results when feature_group_path is missing", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    const req = mockNextRequest({ method: "POST", body: {} });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await json(res)).toEqual({ results: [] });
  });

  it("returns empty results when feature_group_path is empty string", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    const req = mockNextRequest({
      method: "POST",
      body: { feature_group_path: "   " },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await json(res)).toEqual({ results: [] });
  });

  it("URL encodes the feature group path", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");
    mockFetch.mockResolvedValue(mockFetchResponse([]));

    const req = mockNextRequest({
      method: "POST",
      body: { feature_group_path: "/user@bvbrc/home/my group" },
    });
    await POST(req);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain(
      "FeatureGroup(%2Fuser%40bvbrc%2Fhome%2Fmy%20group)",
    );
  });

  it("returns results on success", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    const features = [
      { feature_id: "f1", patric_id: "p1" },
      { feature_id: "f2", patric_id: "p2" },
    ];
    mockFetch.mockResolvedValue(mockFetchResponse(features));

    const req = mockNextRequest({
      method: "POST",
      body: { feature_group_path: "/user/home/group" },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await json(res)).toEqual({ results: features });
  });

  it("returns upstream error on non-ok response", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");
    mockFetch.mockResolvedValue(mockFetchResponse("err", false, 502));

    const req = mockNextRequest({
      method: "POST",
      body: { feature_group_path: "/user/home/group" },
    });
    const res = await POST(req);

    expect(res.status).toBe(502);
    expect(await json(res)).toEqual(
      expect.objectContaining({ error: expect.stringContaining("failed") }),
    );
  });
});
