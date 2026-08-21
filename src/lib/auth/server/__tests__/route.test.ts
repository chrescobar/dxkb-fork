const mocks = vi.hoisted(() => ({
  readSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("../session", () => ({ readSession: mocks.readSession }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { NextRequest, NextResponse } from "next/server";
import { readAuthSession, requireAuthSession, withAuth } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
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
    const session = { token: "t", userId: "u" };
    mocks.readSession
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(session)
      .mockResolvedValueOnce(session);
    expect(await readAuthSession()).toBeNull();
    await expect(requireAuthSession()).rejects.toThrow(
      "Authentication required",
    );
    await expect(readAuthSession()).resolves.toEqual(session);
    await expect(requireAuthSession()).resolves.toEqual(session);
  });
});
