const mocks = vi.hoisted(() => ({
  readSession: vi.fn(),
  getCurrentUser: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("../session", () => ({ readSession: mocks.readSession }));
vi.mock("../actions", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { NextRequest, NextResponse } from "next/server";
import {
  authFetch,
  readAuthSession,
  requireAuthSession,
  requireUser,
  withAuth,
} from "../route";
import { serverUserAgent } from "../user-agent";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("direct route helpers", () => {
  it("returns session_expired only when an app guard has no session", async () => {
    mocks.readSession.mockResolvedValue(null);
    const handler = vi.fn();
    const response = await withAuth(handler)(
      new NextRequest("http://localhost/api/x"),
      {},
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Authentication required",
      code: "session_expired",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("reads once and passes the session directly to a handler", async () => {
    mocks.readSession.mockResolvedValue({
      token: "t",
      userId: "u",
      realm: "r",
    });
    const handler = vi.fn((_request, context) =>
      Promise.resolve(NextResponse.json(context)),
    );
    await withAuth(handler)(new NextRequest("http://localhost/api/x"), {
      params: "p",
    });
    expect(mocks.readSession).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.any(NextRequest), {
      params: "p",
      token: "t",
      userId: "u",
      realm: "r",
    });
  });

  it("supports nullable and required session reads", async () => {
    mocks.readSession.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    expect(await readAuthSession()).toBeNull();
    await expect(requireAuthSession()).rejects.toThrow(
      "Authentication required",
    );
  });
});

describe("authFetch", () => {
  it("adds auth and user-agent without adding a content type", async () => {
    mocks.readSession.mockResolvedValue({ token: "t", userId: "u" });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    await authFetch("https://service.test/x");
    const headers = new Headers(fetchSpy.mock.calls[0][1]?.headers);
    expect(headers.get("Authorization")).toBe("t");
    expect(headers.get("User-Agent")).toBe(serverUserAgent);
    expect(headers.has("Content-Type")).toBe(false);
    fetchSpy.mockRestore();
  });

  it("preserves Request headers and lets init headers override them", async () => {
    mocks.readSession.mockResolvedValue({ token: "t", userId: "u" });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    await authFetch(
      new Request("https://service.test/x", {
        headers: { "User-Agent": "request-agent", "X-Request": "request" },
      }),
      { headers: { "User-Agent": "init-agent", "X-Init": "init" } },
    );

    const headers = new Headers(fetchSpy.mock.calls[0][1]?.headers);
    expect(headers.get("User-Agent")).toBe("init-agent");
    expect(headers.get("X-Request")).toBe("request");
    expect(headers.get("X-Init")).toBe("init");
    expect(headers.get("Authorization")).toBe("t");
    fetchSpy.mockRestore();
  });

  it("does not clear auth state after a service 401", async () => {
    mocks.readSession.mockResolvedValue({ token: "t", userId: "u" });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 401 }));
    expect((await authFetch("https://service.test/x")).status).toBe(401);
    expect(mocks.readSession).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore();
  });
});

describe("requireUser", () => {
  it("returns a browser-safe current user", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "u",
      username: "u",
      email: "u@x",
    });
    expect(await requireUser()).toMatchObject({ id: "u" });
  });

  it("redirects guests", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    await expect(requireUser("/login")).rejects.toThrow("NEXT_REDIRECT:/login");
  });
});
