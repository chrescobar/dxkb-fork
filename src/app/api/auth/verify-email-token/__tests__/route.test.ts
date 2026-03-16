vi.mock("@/lib/env", () => ({
  getRequiredEnv: vi.fn(() => "http://mock-verification-url"),
}));

import { mockNextRequest } from "@/test-helpers/api-route-helpers";
import { GET } from "../route";

describe("GET /api/auth/verify-email-token", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 400 when token is missing", async () => {
    const request = mockNextRequest({
      searchParams: { username: "testuser" },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe(
      "Verification token and username are required",
    );
  });

  it("returns 400 when username is missing", async () => {
    const request = mockNextRequest({
      searchParams: { token: "verify-token" },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe(
      "Verification token and username are required",
    );
  });

  it("returns success with data on successful verification", async () => {
    const resultPayload = { verified: true, userId: "user123" };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(resultPayload),
    });

    const request = mockNextRequest({
      searchParams: { token: "verify-token", username: "testuser" },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Email verified successfully");
    expect(data.data).toEqual(resultPayload);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-verification-url",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          token: "verify-token",
          username: "testuser",
        }),
      }),
    );
  });

  it("returns upstream error with message", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ message: "Token expired" }),
    });

    const request = mockNextRequest({
      searchParams: { token: "expired-token", username: "testuser" },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Token expired");
    expect(data.error).toEqual({ message: "Token expired" });
  });

  it("returns default error message when upstream JSON parse fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    const request = mockNextRequest({
      searchParams: { token: "bad-token", username: "testuser" },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Email verification failed");
  });

  it("returns 504 on AbortError (timeout)", async () => {
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";
    mockFetch.mockRejectedValue(abortError);

    const request = mockNextRequest({
      searchParams: { token: "slow-token", username: "testuser" },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(504);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Email verification request timed out");
  });

  it("returns 500 on other errors", async () => {
    mockFetch.mockRejectedValue(new Error("Unexpected failure"));

    const request = mockNextRequest({
      searchParams: { token: "some-token", username: "testuser" },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe(
      "Internal server error during email verification",
    );
  });
});
