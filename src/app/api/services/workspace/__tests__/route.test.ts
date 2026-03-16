import { POST } from "../route";
import {
  mockNextRequest,
  mockFetchResponse,
} from "@/test-helpers/api-route-helpers";

vi.mock("@/lib/auth", () => ({ getBvbrcAuthToken: vi.fn() }));
vi.mock("@/lib/env", () => ({
  getRequiredEnv: vi.fn(() => "http://mock-workspace-api"),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

async function json(res: Response) {
  return res.json();
}

describe("POST /api/services/workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no auth token", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue(undefined);

    const req = mockNextRequest({
      method: "POST",
      body: { method: "Workspace.ls", params: [] },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(await json(res)).toEqual(
      expect.objectContaining({ error: "Authentication required" }),
    );
  });

  it("returns 400 when method is missing", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    const req = mockNextRequest({
      method: "POST",
      body: { params: [] },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await json(res)).toEqual(
      expect.objectContaining({ error: "method is required" }),
    );
  });

  it("wraps request in JSON-RPC 2.0 envelope", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    const rpcResult = { id: 1, result: [[]], jsonrpc: "2.0" };
    mockFetch.mockResolvedValue(mockFetchResponse(rpcResult));

    const req = mockNextRequest({
      method: "POST",
      body: { method: "Workspace.ls", params: [{ paths: ["/user/"] }] },
    });
    await POST(req);

    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(fetchBody).toEqual(
      expect.objectContaining({
        id: 1,
        method: "Workspace.ls",
        params: [{ paths: ["/user/"] }],
        jsonrpc: "2.0",
      }),
    );
  });

  it("sends Authorization header with auth token", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("my-auth-token");
    mockFetch.mockResolvedValue(
      mockFetchResponse({ id: 1, result: [], jsonrpc: "2.0" }),
    );

    const req = mockNextRequest({
      method: "POST",
      body: { method: "Workspace.ls", params: [] },
    });
    await POST(req);

    expect(mockFetch.mock.calls[0][1].headers).toEqual(
      expect.objectContaining({ Authorization: "my-auth-token" }),
    );
  });

  it("returns empty result array for preferences GET 404", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    mockFetch.mockResolvedValue(mockFetchResponse("not found", false, 404));

    const req = mockNextRequest({
      method: "POST",
      body: {
        method: "Workspace.get",
        params: [
          { objects: ["/user@bvbrc/home/.preferences/favorites.json"] },
        ],
      },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await json(res)).toEqual(
      expect.objectContaining({ result: [], jsonrpc: "2.0" }),
    );
  });

  it("returns error for non-preferences 404", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    mockFetch.mockResolvedValue(mockFetchResponse("not found", false, 404));

    const req = mockNextRequest({
      method: "POST",
      body: {
        method: "Workspace.get",
        params: [{ objects: ["/user/home/some-other-file"] }],
      },
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
    expect(await json(res)).toEqual(
      expect.objectContaining({ error: expect.stringContaining("BV-BRC API error") }),
    );
  });

  it("includes sanitized error in response for upstream errors", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    const upstreamError = {
      error: { code: -32600, message: "Invalid Request" },
    };
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: () => Promise.resolve(JSON.stringify(upstreamError)),
      headers: new Headers(),
    });

    const req = mockNextRequest({
      method: "POST",
      body: { method: "Workspace.ls", params: [] },
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await json(res);
    expect(body.apiResponse).toEqual(
      expect.objectContaining({ code: -32600, message: "Invalid Request" }),
    );
  });

  it("returns data on success", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    const rpcResult = {
      id: 1,
      result: [
        [
          ["file1.txt", "txt", "/user/home/file1.txt"],
        ],
      ],
      jsonrpc: "2.0",
    };
    mockFetch.mockResolvedValue(mockFetchResponse(rpcResult));

    const req = mockNextRequest({
      method: "POST",
      body: { method: "Workspace.ls", params: [{ paths: ["/user/home/"] }] },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await json(res)).toEqual(rpcResult);
  });

  it("returns 500 on unexpected exception", async () => {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");
    mockFetch.mockRejectedValue(new Error("connection refused"));

    const req = mockNextRequest({
      method: "POST",
      body: { method: "Workspace.ls", params: [] },
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(await json(res)).toEqual(
      expect.objectContaining({ error: "Internal server error" }),
    );
  });
});
