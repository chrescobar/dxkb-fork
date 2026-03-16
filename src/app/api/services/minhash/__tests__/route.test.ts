import { NextRequest } from "next/server";
import { mockFetchResponse } from "@/test-helpers/api-route-helpers";

vi.mock("@/lib/auth", () => ({ getBvbrcAuthToken: vi.fn() }));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

async function json(res: Response) {
  return res.json();
}

describe("POST /api/services/minhash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 500 when MINHASH_SERVICE_URL is not set", async () => {
    vi.stubEnv("MINHASH_SERVICE_URL", "");

    const { POST } = await import("../route");
    const req = new NextRequest("http://localhost:3019/api/services/minhash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "test" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(await json(res)).toEqual(
      expect.objectContaining({
        error: expect.stringContaining("MINHASH_SERVICE_URL"),
      }),
    );
  });

  it("returns 400 on malformed JSON body", async () => {
    vi.stubEnv("MINHASH_SERVICE_URL", "http://mock-minhash");

    const { POST } = await import("../route");
    const req = new NextRequest("http://localhost:3019/api/services/minhash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json{{{",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await json(res)).toEqual(
      expect.objectContaining({ error: "Malformed JSON" }),
    );
  });

  it("returns 400 when body is not an object", async () => {
    vi.stubEnv("MINHASH_SERVICE_URL", "http://mock-minhash");

    const { POST } = await import("../route");
    const req = new NextRequest("http://localhost:3019/api/services/minhash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify("just a string"),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await json(res)).toEqual(
      expect.objectContaining({
        error: "Request body must be a JSON object",
      }),
    );
  });

  it("includes auth header when token is present", async () => {
    vi.stubEnv("MINHASH_SERVICE_URL", "http://mock-minhash");

    const { POST } = await import("../route");
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("my-token");
    mockFetch.mockResolvedValue(mockFetchResponse({ result: "ok" }));

    const req = new NextRequest("http://localhost:3019/api/services/minhash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "test" }),
    });
    await POST(req);

    expect(mockFetch.mock.calls[0][1].headers).toEqual(
      expect.objectContaining({ Authorization: "my-token" }),
    );
  });

  it("omits auth header when token is absent", async () => {
    vi.stubEnv("MINHASH_SERVICE_URL", "http://mock-minhash");

    const { POST } = await import("../route");
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue(undefined);
    mockFetch.mockResolvedValue(mockFetchResponse({ result: "ok" }));

    const req = new NextRequest("http://localhost:3019/api/services/minhash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "test" }),
    });
    await POST(req);

    expect(mockFetch.mock.calls[0][1].headers).not.toHaveProperty(
      "Authorization",
    );
  });

  it("returns upstream error on non-ok response", async () => {
    vi.stubEnv("MINHASH_SERVICE_URL", "http://mock-minhash");

    const { POST } = await import("../route");
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");
    mockFetch.mockResolvedValue(mockFetchResponse({ error: "bad request" }, false, 400));

    const req = new NextRequest("http://localhost:3019/api/services/minhash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "test" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await json(res)).toEqual(
      expect.objectContaining({ error: "bad request" }),
    );
  });

  it("returns data on success", async () => {
    vi.stubEnv("MINHASH_SERVICE_URL", "http://mock-minhash");

    const { POST } = await import("../route");
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    vi.mocked(getBvbrcAuthToken).mockResolvedValue("token");

    const resultData = { result: [{ genome_id: "1.1", distance: 0.1 }] };
    mockFetch.mockResolvedValue(mockFetchResponse(resultData));

    const req = new NextRequest("http://localhost:3019/api/services/minhash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "lookup", params: {} }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await json(res)).toEqual(resultData);
  });
});
