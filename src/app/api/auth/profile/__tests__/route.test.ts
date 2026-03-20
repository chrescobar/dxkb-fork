vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
  serverAuthenticatedFetch: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getRequiredEnv: vi.fn(() => "http://mock-user-url"),
}));

import { http, HttpResponse } from "msw";
import { server } from "@/test-helpers/msw-server";
import { mockNextRequest } from "@/test-helpers/api-route-helpers";
import { GET, POST } from "../route";
import { getSession, serverAuthenticatedFetch } from "@/lib/auth/session";

const mockGetSession = vi.mocked(getSession);
const mockServerAuthenticatedFetch = vi.mocked(serverAuthenticatedFetch);

describe("GET /api/auth/profile", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue({ token: undefined, userId: undefined, realm: undefined });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe("Authentication required");
  });

  it("returns profile data when authenticated", async () => {
    const profile = { id: "user1", email: "test@example.com", first_name: "Test" };
    mockGetSession.mockResolvedValue({ token: "tok", userId: "user1", realm: undefined });
    mockServerAuthenticatedFetch.mockResolvedValue(
      new Response(JSON.stringify(profile), { status: 200 }),
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(profile);
  });

  it("passes encoded userId in the URL", async () => {
    mockGetSession.mockResolvedValue({ token: "tok", userId: "user@realm.org", realm: undefined });
    mockServerAuthenticatedFetch.mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await GET();

    expect(mockServerAuthenticatedFetch).toHaveBeenCalledWith(
      "http://mock-user-url/user%40realm.org",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
  });

  it("returns upstream status when fetch fails", async () => {
    mockGetSession.mockResolvedValue({ token: "tok", userId: "user1", realm: undefined });
    mockServerAuthenticatedFetch.mockResolvedValue(
      new Response(null, { status: 404 }),
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toBe("Failed to fetch profile");
  });

  it("returns 500 when an exception is thrown", async () => {
    mockGetSession.mockResolvedValue({ token: "tok", userId: "user1", realm: undefined });
    mockServerAuthenticatedFetch.mockRejectedValue(new Error("network error"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe("Internal server error");
  });
});

describe("POST /api/auth/profile", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue({ token: undefined, userId: undefined, realm: undefined });

    const request = mockNextRequest({
      method: "POST",
      body: [{ op: "replace", path: "/email", value: "new@example.com" }],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe("Authentication required");
  });

  it("returns 401 when token is missing", async () => {
    mockGetSession.mockResolvedValue({ token: undefined, userId: "user1", realm: undefined });

    const request = mockNextRequest({
      method: "POST",
      body: [{ op: "replace", path: "/email", value: "new@example.com" }],
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("forwards JSON Patch body to upstream", async () => {
    mockGetSession.mockResolvedValue({ token: "the-token", userId: "user1", realm: undefined });

    const patchOps = [{ op: "replace", path: "/email", value: "new@example.com" }];
    let capturedBody: string | null = null;
    let capturedContentType: string | null = null;
    let capturedAuthorization: string | null = null;

    server.use(
      http.post("http://mock-user-url/user1", async ({ request }) => {
        capturedBody = await request.text();
        capturedContentType = request.headers.get("Content-Type");
        capturedAuthorization = request.headers.get("Authorization");
        return HttpResponse.json({ success: true });
      }),
    );

    const request = mockNextRequest({
      method: "POST",
      body: patchOps,
    });

    await POST(request);

    expect(capturedBody).toBe(JSON.stringify(patchOps));
    expect(capturedContentType).toBe("application/json-patch+json");
    expect(capturedAuthorization).toBe("the-token");
  });

  it("returns success when upstream succeeds", async () => {
    mockGetSession.mockResolvedValue({ token: "the-token", userId: "user1", realm: undefined });

    server.use(
      http.post("http://mock-user-url/user1", () =>
        HttpResponse.json({ ok: true }),
      ),
    );

    const request = mockNextRequest({
      method: "POST",
      body: [{ op: "replace", path: "/first_name", value: "New" }],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("returns upstream status when upstream fails", async () => {
    mockGetSession.mockResolvedValue({ token: "the-token", userId: "user1", realm: undefined });

    server.use(
      http.post("http://mock-user-url/user1", () =>
        new HttpResponse("Bad Request", { status: 400 }),
      ),
    );

    const request = mockNextRequest({
      method: "POST",
      body: [{ op: "replace", path: "/email", value: "bad" }],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Bad Request");
  });

  it("returns fallback message when upstream error body is empty", async () => {
    mockGetSession.mockResolvedValue({ token: "the-token", userId: "user1", realm: undefined });

    server.use(
      http.post("http://mock-user-url/user1", () =>
        new HttpResponse("", { status: 422 }),
      ),
    );

    const request = mockNextRequest({
      method: "POST",
      body: [{ op: "replace", path: "/email", value: "bad" }],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.message).toBe("Failed to update profile");
  });

  it("returns 500 when an exception is thrown", async () => {
    mockGetSession.mockResolvedValue({ token: "the-token", userId: "user1", realm: undefined });

    server.use(
      http.post("http://mock-user-url/user1", () => HttpResponse.error()),
    );

    const request = mockNextRequest({
      method: "POST",
      body: [{ op: "replace", path: "/email", value: "new@example.com" }],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe("Internal server error");
  });
});
