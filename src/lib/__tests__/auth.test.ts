const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

import {
  safeDecodeURIComponent,
  getBvbrcAuthToken,
  serverAuthenticatedFetch,
} from "../auth";

describe("safeDecodeURIComponent", () => {
  it("decodes a valid percent-encoded string", () => {
    expect(safeDecodeURIComponent("%20")).toBe(" ");
  });

  it("decodes a complex encoded string", () => {
    expect(safeDecodeURIComponent("hello%20world%21")).toBe("hello world!");
  });

  it("returns original string on malformed input", () => {
    const malformed = "%E0%A4%A";
    expect(safeDecodeURIComponent(malformed)).toBe(malformed);
  });

  it("handles already-decoded strings", () => {
    expect(safeDecodeURIComponent("hello")).toBe("hello");
  });
});

describe("getBvbrcAuthToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns decoded token when cookie exists", async () => {
    mockCookieStore.get.mockReturnValue({
      value: "un%3Duser%40bvbrc.org%7Csig%3Dabc",
    });

    const token = await getBvbrcAuthToken();

    expect(mockCookieStore.get).toHaveBeenCalledWith("bvbrc_token");
    expect(token).toBe("un=user@bvbrc.org|sig=abc");
  });

  it("returns undefined when no cookie exists", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const token = await getBvbrcAuthToken();

    expect(mockCookieStore.get).toHaveBeenCalledWith("bvbrc_token");
    expect(token).toBeUndefined();
  });
});

describe("serverAuthenticatedFetch", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds Authorization header when authenticated", async () => {
    const testToken = "un=testuser@bvbrc.org|sig=abc123";
    mockCookieStore.get.mockReturnValue({ value: testToken });
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ ok: true })));

    await serverAuthenticatedFetch("https://api.example.com/data");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/data",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: testToken,
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("throws when not authenticated", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    await expect(
      serverAuthenticatedFetch("https://api.example.com/data"),
    ).rejects.toThrow("Not authenticated");

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
