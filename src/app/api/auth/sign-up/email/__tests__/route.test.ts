vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ get: vi.fn(), set: vi.fn() })),
}));

vi.mock("@/app/api/auth/utils", () => ({
  setBvbrcAuthCookies: vi.fn(),
  getProfileMetadata: vi.fn(),
  extractRealmFromToken: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getRequiredEnv: vi.fn(() => "http://mock-register-url"),
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

describe("POST /api/auth/sign-up/email", () => {
  const mockFetch = vi.fn();

  const validBody = {
    username: "newuser",
    email: "new@example.com",
    password: "secret123",
    password_repeat: "secret123",
    first_name: "New",
    last_name: "User",
  };

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
      body: { email: "a@b.com", password: "p", password_repeat: "p" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe(
      "Username, email, and password are required",
    );
  });

  it("returns 400 when email is missing", async () => {
    const request = mockNextRequest({
      method: "POST",
      body: { username: "u", password: "p", password_repeat: "p" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe(
      "Username, email, and password are required",
    );
  });

  it("returns 400 when password is missing", async () => {
    const request = mockNextRequest({
      method: "POST",
      body: { username: "u", email: "a@b.com", password_repeat: "p" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe(
      "Username, email, and password are required",
    );
  });

  it("returns 400 when passwords do not match", async () => {
    const request = mockNextRequest({
      method: "POST",
      body: {
        username: "u",
        email: "a@b.com",
        password: "one",
        password_repeat: "two",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Passwords do not match");
  });

  it("returns upstream error with JSON message", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      text: () =>
        Promise.resolve(JSON.stringify({ message: "Username already taken" })),
    });

    const request = mockNextRequest({
      method: "POST",
      body: validBody,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.message).toBe("Username already taken");
  });

  it("returns upstream error with plain text message", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      text: () => Promise.resolve("Plain text error"),
    });

    const request = mockNextRequest({
      method: "POST",
      body: validBody,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.message).toBe("Plain text error");
  });

  it("returns upstream error with default message when text is empty", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve(""),
    });

    const request = mockNextRequest({
      method: "POST",
      body: validBody,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe("Registration failed");
  });

  it("returns 502 when token is missing from response", async () => {
    const headers = new Headers();
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(""),
      headers,
    });

    const request = mockNextRequest({
      method: "POST",
      body: validBody,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.message).toBe("Registration failed: missing auth token");
  });

  it("returns user data on successful registration with profile", async () => {
    const profile = {
      id: "user123",
      email: "new@example.com",
      first_name: "New",
      last_name: "User",
    };
    mockGetProfileMetadata.mockResolvedValue(profile);
    mockExtractRealmFromToken.mockReturnValue("patricbrc.org");

    const headers = new Headers();
    headers.set("Authorization", "new-token");
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(""),
      headers,
    });

    const request = mockNextRequest({
      method: "POST",
      body: validBody,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toEqual(
      expect.objectContaining({
        id: "user123",
        username: "newuser",
        email: "new@example.com",
        first_name: "New",
        last_name: "User",
        email_verified: false,
        realm: "patricbrc.org",
      }),
    );
    expect(data.session).toEqual(
      expect.objectContaining({
        token: "",
        expiresAt: expect.any(String),
      }),
    );
    expect(mockSetBvbrcAuthCookies).toHaveBeenCalledWith(
      "new-token",
      "newuser",
      "patricbrc.org",
      profile,
    );
  });

  it("always sets email_verified to false regardless of profile", async () => {
    const profile = {
      id: "user123",
      email_verified: true,
    };
    mockGetProfileMetadata.mockResolvedValue(profile);

    const headers = new Headers();
    headers.set("Authorization", "new-token");
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(""),
      headers,
    });

    const request = mockNextRequest({
      method: "POST",
      body: validBody,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.user.email_verified).toBe(false);
  });

  it("returns 503 when an exception is thrown", async () => {
    mockFetch.mockRejectedValue(new Error("Network failure"));

    const request = mockNextRequest({
      method: "POST",
      body: validBody,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.message).toBe("Registration service unavailable");
  });
});
