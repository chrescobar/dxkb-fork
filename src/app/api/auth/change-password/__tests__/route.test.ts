import { http, HttpResponse } from "msw";
import { server } from "@/test-helpers/msw-server";

import {
  clearTestCookies,
  mockNextRequest,
  setTestSession,
} from "@/test-helpers/api-route-helpers";
import { POST } from "../route";

const userUrl = "https://user.test/user";

beforeEach(() => {
  process.env.USER_URL = userUrl;
  clearTestCookies();
});

afterEach(() => {
  delete process.env.USER_URL;
});

function setSessionCookies(token: string, userId: string) {
  setTestSession({ token, userId });
}

describe("POST /api/auth/change-password", () => {
  it("returns 400 when both fields are missing without calling upstream", async () => {
    let upstreamCalled = false;
    server.use(
      http.post(`${userUrl}/`, () => {
        upstreamCalled = true;
        return HttpResponse.json({ id: 1, jsonrpc: "2.0", result: null });
      }),
    );

    const request = mockNextRequest({ method: "POST", body: {} });
    const response = await POST(request, {});
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(data.error).toBe("Current password and new password are required");
    expect(upstreamCalled).toBe(false);
  });

  it("returns 401 when no session cookies are set so the session.read() returns null", async () => {
    clearTestCookies();

    const request = mockNextRequest({
      method: "POST",
      body: { currentPassword: "old", newPassword: "newSecret123" },
    });
    const response = await POST(request, {});
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(data.error).toMatch(/authentication required/i);
  });

  it("forwards the JSON-RPC setPassword body with the session token as the Authorization header to USER_URL on success", async () => {
    setSessionCookies("valid-token", "alice");

    const captured: {
      authorization: string | null;
      contentType: string | null;
      body: string | null;
    } = { authorization: null, contentType: null, body: null };
    server.use(
      http.post(`${userUrl}/`, async ({ request }) => {
        captured.authorization = request.headers.get("Authorization");
        captured.contentType = request.headers.get("Content-Type");
        captured.body = await request.text();
        return HttpResponse.json({ id: 1, jsonrpc: "2.0", result: null });
      }),
    );

    const request = mockNextRequest({
      method: "POST",
      body: { currentPassword: "old", newPassword: "newSecret123" },
    });
    const response = await POST(request, {});
    const data = (await response.json()) as { success?: boolean };

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(captured.authorization).toBe("valid-token");
    expect(captured.contentType).toBe("application/json");

    expect(captured.body).not.toBeNull();
    if (captured.body === null) throw new Error("captured.body never set");
    const parsedBody = JSON.parse(captured.body) as {
      jsonrpc?: string;
      method?: string;
      params?: unknown[];
    };
    expect(parsedBody.jsonrpc).toBe("2.0");
    expect(parsedBody.method).toBe("setPassword");
    // params: [userId, currentPassword, newPassword] — pulled from session cookies + body.
    expect(parsedBody.params).toEqual(["alice", "old", "newSecret123"]);
  });

  it("propagates the JSON-RPC error message when upstream returns a 200 with an error envelope", async () => {
    setSessionCookies("valid-token", "alice");

    server.use(
      http.post(`${userUrl}/`, () =>
        HttpResponse.json({
          id: 1,
          jsonrpc: "2.0",
          error: { message: "Wrong current password" },
        }),
      ),
    );

    const request = mockNextRequest({
      method: "POST",
      body: { currentPassword: "wrong", newPassword: "newSecret123" },
    });
    const response = await POST(request, {});
    const data = (await response.json()) as { error?: string };

    // bvbrcIdentity.changePassword maps a JSON-RPC error envelope to fail("validation", msg, 400)
    // and the route surfaces error.status (400) directly.
    expect(response.status).toBe(400);
    expect(data.error).toBe("Failed to change password");
  });

  it("returns the upstream HTTP status with a safe fallback message", async () => {
    setSessionCookies("valid-token", "alice");

    server.use(
      http.post(`${userUrl}/`, () =>
        new HttpResponse("Forbidden", { status: 403 }),
      ),
    );

    const request = mockNextRequest({
      method: "POST",
      body: { currentPassword: "old", newPassword: "newSecret123" },
    });
    const response = await POST(request, {});
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(403);
    expect(data.error).toBe("Failed to change password");
  });
});
