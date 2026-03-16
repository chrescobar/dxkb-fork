import { mockNextRequest } from "@/test-helpers/api-route-helpers";
import { POST } from "../route";

describe("POST /api/auth/forget-password", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 400 when no identifier is provided", async () => {
    const request = mockNextRequest({
      method: "POST",
      body: {},
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Email or username is required");
  });

  it("accepts usernameOrEmail field", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const request = mockNextRequest({
      method: "POST",
      body: { usernameOrEmail: "testuser" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Password reset email sent successfully");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://user.bv-brc.org/reset",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("accepts email field as fallback", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const request = mockNextRequest({
      method: "POST",
      body: { email: "test@example.com" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("returns upstream error with message from JSON response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: "User not found" }),
    });

    const request = mockNextRequest({
      method: "POST",
      body: { usernameOrEmail: "unknown" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.message).toBe("User not found");
  });

  it("returns default error message when upstream JSON parse fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    const request = mockNextRequest({
      method: "POST",
      body: { usernameOrEmail: "testuser" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Failed to send password reset email");
  });

  it("returns 503 when an exception is thrown", async () => {
    mockFetch.mockRejectedValue(new Error("Network failure"));

    const request = mockNextRequest({
      method: "POST",
      body: { usernameOrEmail: "testuser" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Password reset service unavailable");
  });
});
