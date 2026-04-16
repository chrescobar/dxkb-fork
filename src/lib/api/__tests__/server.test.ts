const { mockCookieStore } = vi.hoisted(() => ({
  mockCookieStore: { get: vi.fn(), set: vi.fn() },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

import { NextRequest, NextResponse } from "next/server";
import { errorResponse, withAuth, withOptionalAuth } from "../server";
import { JsonRpcError } from "@/lib/jsonrpc-client";

describe("errorResponse", () => {
  it("normalizes a plain Error to { error } with status 500", async () => {
    const response = errorResponse(new Error("something broke"));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual(
      expect.objectContaining({ error: "something broke", code: "upstream" }),
    );
  });

  it("normalizes a JsonRpcError with code and data", async () => {
    const rpcError = new JsonRpcError("Method not found", -32601, {
      detail: "x",
    });
    const response = errorResponse(rpcError);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual(
      expect.objectContaining({
        error: "Method not found",
        code: "upstream",
      }),
    );
  });

  it("uses a provided fallback status", () => {
    const response = errorResponse(new Error("not found"), 404);
    expect(response.status).toBe(404);
  });

  it("handles non-Error values", async () => {
    const response = errorResponse("string error");
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual(
      expect.objectContaining({ error: "Internal server error" }),
    );
  });
});

describe("withAuth", () => {
  function makeRequest(
    url = "http://localhost/api/test",
    init?: RequestInit,
  ): NextRequest {
    return new NextRequest(url, init);
  }

  it("injects token into the handler when authenticated", async () => {
    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === "bvbrc_token") return { value: "test-token-value" };
      return undefined;
    });

    const handler = withAuth(async (_req, { token }) => {
      return NextResponse.json({ received: token });
    });

    const response = await handler(makeRequest(), {});
    const body = await response.json();
    expect(body.received).toBe("test-token-value");
  });

  it("returns 401 when not authenticated", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const handler = withAuth(async () => {
      return NextResponse.json({ should: "not reach" });
    });

    const response = await handler(makeRequest(), {});
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Authentication required");
  });

  it("catches thrown errors and returns errorResponse", async () => {
    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === "bvbrc_token") return { value: "token" };
      return undefined;
    });

    const handler = withAuth(async () => {
      throw new Error("handler exploded");
    });

    const response = await handler(makeRequest(), {});
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("handler exploded");
  });
});

describe("withOptionalAuth", () => {
  function makeRequest(
    url = "http://localhost/api/test",
    init?: RequestInit,
  ): NextRequest {
    return new NextRequest(url, init);
  }

  it("injects token as undefined when not authenticated", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const handler = withOptionalAuth(async (_req, { token }) => {
      return NextResponse.json({ token: token ?? "none" });
    });

    const response = await handler(makeRequest(), {});
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.token).toBe("none");
  });

  it("injects token when authenticated", async () => {
    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === "bvbrc_token") return { value: "my-token" };
      return undefined;
    });

    const handler = withOptionalAuth(async (_req, { token }) => {
      return NextResponse.json({ token });
    });

    const response = await handler(makeRequest(), {});
    const body = await response.json();
    expect(body.token).toBe("my-token");
  });
});
