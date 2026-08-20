import { http, HttpResponse } from "msw";
import { server } from "@/test-helpers/msw-server";
import { mockNextRequest } from "@/test-helpers/api-route-helpers";
import { POST } from "../route";

beforeEach(() => {
  process.env.USER_PASSWORD_RESET_URL = "https://auth.test/reset";
});

afterEach(() => {
  delete process.env.USER_PASSWORD_RESET_URL;
});

describe("POST /api/auth/forget-password", () => {
  it("returns 400 when no identifier is provided", async () => {
    const request = mockNextRequest({
      method: "POST",
      body: {},
    });

    const response = await POST(request, {});
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(data.error).toBe("Email or username is required");
  });

  it("accepts usernameOrEmail field", async () => {
    let handlerCalled = false;
    server.use(
      http.post("https://auth.test/reset", () => {
        handlerCalled = true;
        return new HttpResponse(null, { status: 200 });
      }),
    );

    const request = mockNextRequest({
      method: "POST",
      body: { usernameOrEmail: "testuser" },
    });

    const response = await POST(request, {});
    const data = (await response.json()) as { success?: boolean };

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(handlerCalled).toBe(true);
  });

  it("rejects the removed email field alias", async () => {
    const request = mockNextRequest({
      method: "POST",
      body: { email: "test@example.com" },
    });

    const response = await POST(request, {});
    expect(response.status).toBe(400);
  });

  it("returns a safe fallback for an upstream JSON error", async () => {
    server.use(
      http.post("https://auth.test/reset", () => {
        return HttpResponse.json(
          { message: "User not found" },
          { status: 404 },
        );
      }),
    );

    const request = mockNextRequest({
      method: "POST",
      body: { usernameOrEmail: "unknown" },
    });

    const response = await POST(request, {});
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(404);
    expect(data.error).toBe("Failed to send password reset email");
  });

  it("returns default error message when upstream JSON parse fails", async () => {
    server.use(
      http.post("https://auth.test/reset", () => {
        return new HttpResponse("not json", { status: 500 });
      }),
    );

    const request = mockNextRequest({
      method: "POST",
      body: { usernameOrEmail: "testuser" },
    });

    const response = await POST(request, {});
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to send password reset email");
  });

  it("returns 502 when a network exception is thrown", async () => {
    server.use(
      http.post("https://auth.test/reset", () => {
        return HttpResponse.error();
      }),
    );

    const request = mockNextRequest({
      method: "POST",
      body: { usernameOrEmail: "testuser" },
    });

    const response = await POST(request, {});
    const data = (await response.json()) as { code?: string };

    expect(response.status).toBe(502);
    expect(data).toMatchObject({ code: "upstream" });
  });
});
