vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ get: vi.fn(), set: vi.fn() })),
}));

vi.mock("@/app/api/auth/utils", () => ({
  setBvbrcAuthCookies: vi.fn(),
  getProfileMetadata: vi.fn(),
  extractRealmFromToken: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getRequiredEnv: vi.fn(() => "http://mock-auth-url"),
}));

import { mockNextRequest } from "@/test-helpers/api-route-helpers";
import { POST } from "../route";
import {
  setBvbrcAuthCookies,
  getProfileMetadata,
  extractRealmFromToken,
} from "@/app/api/auth/utils";

const mockSetBvbrcAuthCookies = vi.mocked(setBvbrcAuthCookies);
const mockGetProfileMetadata = vi.mocked(getProfileMetadata);
const mockExtractRealmFromToken = vi.mocked(extractRealmFromToken);

describe("POST /api/auth/sign-in/email", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    mockExtractRealmFromToken.mockReturnValue("patricbrc.org");
    mockGetProfileMetadata.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 400 when username is missing", async () => {
    const request = mockNextRequest({
      method: "POST",
      body: { password: "secret" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Username and password are required");
  });

  it("returns 400 when password is missing", async () => {
    const request = mockNextRequest({
      method: "POST",
      body: { username: "testuser" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Username and password are required");
  });

  it("returns 401 when upstream returns 401", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 });

    const request = mockNextRequest({
      method: "POST",
      body: { username: "testuser", password: "wrong" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe("Invalid credentials");
  });

  it("returns 401 when upstream returns 403", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403 });

    const request = mockNextRequest({
      method: "POST",
      body: { username: "testuser", password: "wrong" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe("Invalid credentials");
  });

  it("returns 503 when upstream returns a non-auth error", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const request = mockNextRequest({
      method: "POST",
      body: { username: "testuser", password: "pass" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.message).toBe("Authentication service unavailable");
  });

  it("uses token from Authorization header when available", async () => {
    const headers = new Headers();
    headers.set("Authorization", "auth-token-from-header");
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("body-token"),
      headers,
    });

    const request = mockNextRequest({
      method: "POST",
      body: { username: "testuser", password: "pass" },
    });

    await POST(request);

    expect(mockExtractRealmFromToken).toHaveBeenCalledWith(
      "auth-token-from-header",
    );
  });

  it("falls back to body text when Authorization header is absent", async () => {
    const headers = new Headers();
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("body-token-value"),
      headers,
    });

    const request = mockNextRequest({
      method: "POST",
      body: { username: "testuser", password: "pass" },
    });

    await POST(request);

    expect(mockExtractRealmFromToken).toHaveBeenCalledWith("body-token-value");
  });

  it("returns 503 when token is empty", async () => {
    const headers = new Headers();
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(""),
      headers,
    });

    const request = mockNextRequest({
      method: "POST",
      body: { username: "testuser", password: "pass" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.message).toBe("Authentication service unavailable");
  });

  it("calls setBvbrcAuthCookies with correct arguments", async () => {
    const profile = {
      id: "user123",
      email: "test@example.com",
      first_name: "Test",
      last_name: "User",
      email_verified: true,
    };
    mockGetProfileMetadata.mockResolvedValue(profile);
    mockExtractRealmFromToken.mockReturnValue("patricbrc.org");

    const headers = new Headers();
    headers.set("Authorization", "the-token");
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(""),
      headers,
    });

    const request = mockNextRequest({
      method: "POST",
      body: { username: "testuser", password: "pass" },
    });

    await POST(request);

    expect(mockSetBvbrcAuthCookies).toHaveBeenCalledWith(
      "the-token",
      "testuser",
      "patricbrc.org",
      profile,
    );
  });

  it("returns user with profile data when profile is available", async () => {
    const profile = {
      id: "user123",
      email: "test@example.com",
      first_name: "Test",
      last_name: "User",
      email_verified: true,
    };
    mockGetProfileMetadata.mockResolvedValue(profile);
    mockExtractRealmFromToken.mockReturnValue("patricbrc.org");

    const headers = new Headers();
    headers.set("Authorization", "the-token");
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(""),
      headers,
    });

    const request = mockNextRequest({
      method: "POST",
      body: { username: "testuser", password: "pass" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toEqual(
      expect.objectContaining({
        id: "user123",
        username: "testuser",
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        email_verified: true,
        realm: "patricbrc.org",
      }),
    );
    expect(data.session).toEqual(
      expect.objectContaining({
        token: "",
        expiresAt: expect.any(String),
      }),
    );
  });

  it("returns user with fallback values when no profile is available", async () => {
    mockGetProfileMetadata.mockResolvedValue(null);
    mockExtractRealmFromToken.mockReturnValue(undefined);

    const headers = new Headers();
    headers.set("Authorization", "the-token");
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(""),
      headers,
    });

    const request = mockNextRequest({
      method: "POST",
      body: { username: "testuser", password: "pass" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toEqual(
      expect.objectContaining({
        id: "testuser",
        username: "testuser",
        email: "",
        first_name: "",
        last_name: "",
        email_verified: false,
      }),
    );
  });

  it("returns 503 when an exception is thrown", async () => {
    mockFetch.mockRejectedValue(new Error("Network failure"));

    const request = mockNextRequest({
      method: "POST",
      body: { username: "testuser", password: "pass" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.message).toBe("Authentication service unavailable");
  });
});
