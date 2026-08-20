import { http, HttpResponse } from "msw";
import { server } from "@/test-helpers/msw-server";
import { NextRequest } from "next/server";

import {
  clearTestCookies,
  mockNextRequest,
  testCookieStore,
} from "@/test-helpers/api-route-helpers";
import { serverUserAgent } from "@/lib/auth/server/user-agent";
import { POST } from "../route";

const userAuthUrl = "https://auth.test/sign-in";
const userUrl = "https://user.test/user";

beforeEach(() => {
  process.env.USER_AUTH_URL = userAuthUrl;
  process.env.USER_URL = userUrl;
  clearTestCookies();
});

afterEach(() => {
  delete process.env.USER_AUTH_URL;
  delete process.env.USER_URL;
});

function setNamesFromCalls(): string[] {
  return testCookieStore.set.mock.calls.map((call) => call[0]);
}

describe("POST /api/auth/sign-in/email", () => {
  it("forwards form-encoded credentials to USER_AUTH_URL, fetches the profile from USER_URL with the returned token, writes session cookies, and returns the session envelope", async () => {
    let upstreamAuthBody: string | null = null;
    let upstreamAuthContentType: string | null = null;
    let upstreamAuthUserAgent: string | null = null;
    let profileAuthHeader: string | null = null;
    let profileUserAgent: string | null = null;

    server.use(
      http.post(userAuthUrl, async ({ request }) => {
        upstreamAuthBody = await request.text();
        upstreamAuthContentType = request.headers.get("Content-Type");
        upstreamAuthUserAgent = request.headers.get("User-Agent");
        return new HttpResponse("token-abc", {
          headers: { Authorization: "token-abc" },
        });
      }),
      http.get(`${userUrl}/alice`, ({ request }) => {
        profileAuthHeader = request.headers.get("Authorization");
        profileUserAgent = request.headers.get("User-Agent");
        return HttpResponse.json({
          id: "alice",
          email: "alice@example.com",
          first_name: "Alice",
          last_name: "Tester",
          email_verified: true,
          l_id: "alice",
          creation_date: "",
          last_login: "",
          organisms: "",
          reverification: false,
          source: "test",
        });
      }),
    );

    const request = mockNextRequest({
      method: "POST",
      body: { username: "alice", password: "password1234" },
    });
    const response = await POST(request, {});
    const data = (await response.json()) as {
      user?: Record<string, unknown>;
      session?: { expiresAt?: string };
    };

    expect(response.status).toBe(200);
    expect(upstreamAuthContentType).toBe("application/x-www-form-urlencoded");
    expect(upstreamAuthBody).toBe("username=alice&password=password1234");
    expect(upstreamAuthUserAgent).toBe(serverUserAgent);
    expect(profileAuthHeader).toBe("token-abc");
    expect(profileUserAgent).toBe(serverUserAgent);

    const setNames = setNamesFromCalls();
    expect(setNames).toContain("bvbrc_token");
    expect(setNames).toContain("bvbrc_user_id");
    const tokenCall = testCookieStore.set.mock.calls.find(
      (call) => call[0] === "bvbrc_token",
    );
    expect(tokenCall?.[1]).toBe("token-abc");
    expect(tokenCall?.[2]).toEqual(
      expect.objectContaining({
        httpOnly: true,
        path: "/",
        sameSite: "strict",
      }),
    );
    const userIdCall = testCookieStore.set.mock.calls.find(
      (call) => call[0] === "bvbrc_user_id",
    );
    expect(userIdCall?.[1]).toBe("alice");

    expect(data.user).toMatchObject({
      id: "alice",
      username: "alice",
      email: "alice@example.com",
      first_name: "Alice",
      last_name: "Tester",
      email_verified: true,
    });
    expect(data.session).toHaveProperty("expiresAt");
  });

  it("maps upstream 401 to 401 and does not write session cookies", async () => {
    server.use(
      http.post(userAuthUrl, () => new HttpResponse(null, { status: 401 })),
    );

    const request = mockNextRequest({
      method: "POST",
      body: { username: "alice", password: "wrong" },
    });
    const response = await POST(request, {});
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(data.error).toBe("Authentication failed");
    expect(testCookieStore.set).not.toHaveBeenCalled();
  });

  it("passes through upstream 5xx status and does not write session cookies", async () => {
    server.use(
      http.post(userAuthUrl, () => new HttpResponse(null, { status: 500 })),
    );

    const request = mockNextRequest({
      method: "POST",
      body: { username: "alice", password: "password1234" },
    });
    const response = await POST(request, {});

    expect(response.status).toBe(500);
    expect(testCookieStore.set).not.toHaveBeenCalled();
  });

  it("returns 400 with a validation message when credentials are missing and never calls upstream", async () => {
    let upstreamCalled = false;
    server.use(
      http.post(userAuthUrl, () => {
        upstreamCalled = true;
        return new HttpResponse("token", { status: 200 });
      }),
    );

    const request = mockNextRequest({
      method: "POST",
      body: { username: "alice" },
    });
    const response = await POST(request, {});
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/username and password are required/i);
    expect(upstreamCalled).toBe(false);
    expect(testCookieStore.set).not.toHaveBeenCalled();
  });

  it("returns 400 with a validation error when body is malformed JSON", async () => {
    const request = new NextRequest(
      "http://localhost:3019/api/auth/sign-in/email",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{invalid-json",
      },
    );
    const response = await POST(request, {});
    const data = (await response.json()) as { error?: string; code?: string };

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/username and password are required/i);
    expect(data.code).toBe("validation");
    expect(testCookieStore.set).not.toHaveBeenCalled();
  });
});
