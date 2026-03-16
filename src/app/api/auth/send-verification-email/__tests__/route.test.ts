vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ get: vi.fn(), set: vi.fn() })),
}));

vi.mock("@/app/api/auth/utils", () => ({
  getBvbrcAuthData: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getRequiredEnv: vi.fn(() => "http://mock-verification-url"),
}));

import { POST } from "../route";
import { getBvbrcAuthData } from "@/app/api/auth/utils";

const mockGetBvbrcAuthData = vi.mocked(getBvbrcAuthData);

describe("POST /api/auth/send-verification-email", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 401 when no token is present", async () => {
    mockGetBvbrcAuthData.mockResolvedValue({
      token: undefined,
      userId: "testuser",
      realm: undefined,
    });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe(
      "Authentication required. Please sign in first.",
    );
  });

  it("returns 401 when no userId is present", async () => {
    mockGetBvbrcAuthData.mockResolvedValue({
      token: "some-token",
      userId: undefined,
      realm: undefined,
    });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("returns success when verification email is sent", async () => {
    mockGetBvbrcAuthData.mockResolvedValue({
      token: "valid-token",
      userId: "testuser",
      realm: "patricbrc.org",
    });
    mockFetch.mockResolvedValue({ ok: true });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Verification email sent successfully");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-verification-url",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "valid-token",
        }),
        body: JSON.stringify({ id: "testuser" }),
      }),
    );
  });

  it("returns upstream error on non-ok response", async () => {
    mockGetBvbrcAuthData.mockResolvedValue({
      token: "valid-token",
      userId: "testuser",
      realm: undefined,
    });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: () =>
        Promise.resolve({ message: "Too many verification requests" }),
    });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Too many verification requests");
  });

  it("returns 500 when an exception is thrown", async () => {
    mockGetBvbrcAuthData.mockRejectedValue(new Error("Unexpected error"));

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Internal server error");
  });
});
