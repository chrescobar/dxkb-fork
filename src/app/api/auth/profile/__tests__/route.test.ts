import { http, HttpResponse } from "msw";
import { server } from "@/test-helpers/msw-server";
import {
  clearTestCookies,
  mockNextRequest,
  setTestSession,
} from "@/test-helpers/api-route-helpers";
import { GET, POST } from "../route";
const userUrl = "http://mock-user-url";

beforeEach(() => {
  process.env.USER_URL = userUrl;
});

afterEach(() => {
  delete process.env.USER_URL;
});

function setAuthCookies(token: string, userId: string) {
  setTestSession({ token, userId });
}

describe("GET /api/auth/profile", () => {
  it("returns 401 when not authenticated", async () => {
    clearTestCookies();

    const response = await GET(mockNextRequest(), {});
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(data.error).toBe("Authentication required");
  });

  it("returns profile data when authenticated", async () => {
    const profile = {
      id: "user1",
      l_id: "user1",
      email: "test@example.com",
      email_verified: true,
      first_name: "Test",
      last_name: "User",
      creation_date: "",
      last_login: "",
      organisms: "",
      reverification: false,
      source: "test",
    };
    setAuthCookies("tok", "user1");

    server.use(http.get(`${userUrl}/user1`, () => HttpResponse.json(profile)));

    const response = await GET(mockNextRequest(), {});
    const data = (await response.json()) as typeof profile;

    expect(response.status).toBe(200);
    expect(data).toEqual(profile);
  });

  it("passes encoded userId in the URL", async () => {
    setAuthCookies("tok", "user@realm.org");

    let capturedUrl: string | null = null;
    server.use(
      http.get(`${userUrl}/:userId`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({});
      }),
    );

    await GET(mockNextRequest(), {});

    expect(capturedUrl).toBe(`${userUrl}/user%40realm.org`);
  });

  it("returns upstream status when fetch fails", async () => {
    setAuthCookies("tok", "user1");

    server.use(
      http.get(
        `${userUrl}/user1`,
        () => new HttpResponse(null, { status: 404 }),
      ),
    );

    const response = await GET(mockNextRequest(), {});
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(404);
    expect(data.error).toBe("Profile lookup failed");
  });

  it("returns 500 when an exception is thrown", async () => {
    setAuthCookies("tok", "user1");

    server.use(http.get(`${userUrl}/user1`, () => HttpResponse.error()));

    const response = await GET(mockNextRequest(), {});
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(502);
    expect(data.error).toBeDefined();
  });
});

describe("POST /api/auth/profile", () => {
  it("returns 401 when not authenticated", async () => {
    clearTestCookies();

    const request = mockNextRequest({
      method: "POST",
      body: [{ op: "replace", path: "/email", value: "new@example.com" }],
    });

    const response = await POST(request, {});
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(data.error).toBe("Authentication required");
  });

  it("forwards JSON Patch body to upstream", async () => {
    setAuthCookies("the-token", "user1");

    const patchOps = [
      { op: "replace", path: "/email", value: "new@example.com" },
    ];
    let capturedBody: string | null = null;
    let capturedContentType: string | null = null;
    let capturedAuthorization: string | null = null;

    server.use(
      http.post(`${userUrl}/user1`, async ({ request }) => {
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

    await POST(request, {});

    expect(capturedBody).toBe(JSON.stringify(patchOps));
    expect(capturedContentType).toBe("application/json-patch+json");
    expect(capturedAuthorization).toBe("the-token");
  });

  it.each([
    { name: "a non-array body", body: {} },
    {
      name: "an unsupported operation",
      body: [{ op: "remove", path: "/email" }],
    },
    {
      name: "an unsupported path",
      body: [{ op: "replace", path: "/roles", value: "admin" }],
    },
    {
      name: "an invalid string value",
      body: [{ op: "replace", path: "/email", value: 1 }],
    },
    {
      name: "invalid settings",
      body: [{ op: "replace", path: "/settings", value: { unknown: true } }],
    },
  ])("returns 400 for $name", async ({ body }) => {
    setAuthCookies("the-token", "user1");
    const response = await POST(mockNextRequest({ method: "POST", body }), {});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "validation",
    });
  });

  it("returns 400 for malformed JSON", async () => {
    setAuthCookies("the-token", "user1");
    const response = await POST(
      mockNextRequest({ method: "POST", rawBody: "{" }),
      {},
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Malformed JSON",
      code: "validation",
    });
  });

  it("returns success when upstream succeeds", async () => {
    setAuthCookies("the-token", "user1");

    server.use(
      http.post(`${userUrl}/user1`, () => HttpResponse.json({ ok: true })),
    );

    const request = mockNextRequest({
      method: "POST",
      body: [{ op: "replace", path: "/first_name", value: "New" }],
    });

    const response = await POST(request, {});
    const data = (await response.json()) as { success?: boolean };

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("returns upstream status when upstream fails", async () => {
    setAuthCookies("the-token", "user1");

    server.use(
      http.post(
        `${userUrl}/user1`,
        () => new HttpResponse("Bad Request", { status: 400 }),
      ),
    );

    const request = mockNextRequest({
      method: "POST",
      body: [{ op: "replace", path: "/email", value: "bad" }],
    });

    const response = await POST(request, {});
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(data.error).toBe("Failed to update profile");
  });

  it("returns fallback message when upstream error body is empty", async () => {
    setAuthCookies("the-token", "user1");

    server.use(
      http.post(
        `${userUrl}/user1`,
        () => new HttpResponse("", { status: 422 }),
      ),
    );

    const request = mockNextRequest({
      method: "POST",
      body: [{ op: "replace", path: "/email", value: "bad" }],
    });

    const response = await POST(request, {});
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(422);
    expect(data.error).toBe("Failed to update profile");
  });

  it("returns 500 when an exception is thrown", async () => {
    setAuthCookies("the-token", "user1");

    server.use(http.post(`${userUrl}/user1`, () => HttpResponse.error()));

    const request = mockNextRequest({
      method: "POST",
      body: [{ op: "replace", path: "/email", value: "new@example.com" }],
    });

    const response = await POST(request, {});
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(502);
    expect(data.error).toBeDefined();
  });
});
