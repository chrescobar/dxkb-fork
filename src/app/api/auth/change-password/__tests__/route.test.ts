vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getRequiredEnv: vi.fn(() => "http://mock-user-url"),
}));

import { http, HttpResponse } from "msw";
import { server } from "@/test-helpers/msw-server";
import { mockNextRequest } from "@/test-helpers/api-route-helpers";
import { POST } from "../route";
import { getSession } from "@/lib/auth/session";

const mockGetSession = vi.mocked(getSession);

describe("POST /api/auth/change-password", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue({ token: undefined, userId: undefined, realm: undefined });

    const request = mockNextRequest({
      method: "POST",
      body: { currentPassword: "old", newPassword: "new" },
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
      body: { currentPassword: "old", newPassword: "new" },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("forwards JSON-RPC setPassword call to upstream", async () => {
    mockGetSession.mockResolvedValue({ token: "the-token", userId: "testuser", realm: undefined });

    let capturedBody: unknown = null;
    server.use(
      http.post("http://mock-user-url/", async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ id: 1, jsonrpc: "2.0", result: true });
      }),
    );

    const request = mockNextRequest({
      method: "POST",
      body: { currentPassword: "oldpass", newPassword: "newpass" },
    });

    await POST(request);

    expect(capturedBody).toEqual({
      id: 1,
      jsonrpc: "2.0",
      method: "setPassword",
      params: ["testuser", "oldpass", "newpass"],
    });
  });

  it("returns success when upstream succeeds", async () => {
    mockGetSession.mockResolvedValue({ token: "the-token", userId: "testuser", realm: undefined });

    server.use(
      http.post("http://mock-user-url/", () =>
        HttpResponse.json({ id: 1, jsonrpc: "2.0", result: true }),
      ),
    );

    const request = mockNextRequest({
      method: "POST",
      body: { currentPassword: "oldpass", newPassword: "newpass" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("returns upstream status when upstream returns non-ok", async () => {
    mockGetSession.mockResolvedValue({ token: "the-token", userId: "testuser", realm: undefined });

    server.use(
      http.post("http://mock-user-url/", () =>
        new HttpResponse("Forbidden", { status: 403 }),
      ),
    );

    const request = mockNextRequest({
      method: "POST",
      body: { currentPassword: "oldpass", newPassword: "newpass" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.message).toBe("Forbidden");
  });

  it("returns 400 when upstream returns a JSON-RPC error", async () => {
    mockGetSession.mockResolvedValue({ token: "the-token", userId: "testuser", realm: undefined });

    server.use(
      http.post("http://mock-user-url/", () =>
        HttpResponse.json({
          id: 1,
          jsonrpc: "2.0",
          error: { message: "Current password is incorrect" },
        }),
      ),
    );

    const request = mockNextRequest({
      method: "POST",
      body: { currentPassword: "wrong", newPassword: "newpass" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Current password is incorrect");
  });

  it("returns 400 with fallback message when JSON-RPC error has no message", async () => {
    mockGetSession.mockResolvedValue({ token: "the-token", userId: "testuser", realm: undefined });

    server.use(
      http.post("http://mock-user-url/", () =>
        HttpResponse.json({ id: 1, jsonrpc: "2.0", error: {} }),
      ),
    );

    const request = mockNextRequest({
      method: "POST",
      body: { currentPassword: "wrong", newPassword: "newpass" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Failed to change password");
  });

  it("returns 500 when an exception is thrown", async () => {
    mockGetSession.mockResolvedValue({ token: "the-token", userId: "testuser", realm: undefined });

    server.use(
      http.post("http://mock-user-url/", () => HttpResponse.error()),
    );

    const request = mockNextRequest({
      method: "POST",
      body: { currentPassword: "old", newPassword: "new" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe("Internal server error");
  });
});
