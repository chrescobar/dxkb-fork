import { http, HttpResponse } from "msw";

import { server } from "@/test-helpers/msw-server";
import { apiCall, apiGet } from "../client";

describe("API client", () => {
  it("sends credentialed JSON POST requests", async () => {
    server.use(
      http.post("/api/test", async ({ request }) => {
        expect(request.credentials).toBe("include");
        expect(request.headers.get("content-type")).toBe("application/json");
        return HttpResponse.json({ result: await request.json() });
      }),
    );

    await expect(apiCall("/api/test", { foo: "bar" })).resolves.toEqual({
      result: { foo: "bar" },
    });
  });

  it("does not retry or reload for ordinary upstream 401 responses", async () => {
    let calls = 0;
    const reload = vi.fn();
    vi.stubGlobal("window", { location: { reload } });
    server.use(
      http.post("/api/test", () => {
        calls += 1;
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      }),
    );

    await expect(apiCall("/api/test", {})).rejects.toMatchObject({
      status: 401,
      code: "unauthenticated",
    });
    expect(calls).toBe(1);
    expect(reload).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("preserves session_expired and reloads at most once per document", async () => {
    const reload = vi.fn();
    vi.stubGlobal("window", { location: { reload } });
    server.use(
      http.post("/api/expired", () =>
        HttpResponse.json(
          { error: "Session expired", code: "session_expired" },
          { status: 401 },
        ),
      ),
    );

    await expect(apiCall("/api/expired", {})).rejects.toMatchObject({
      status: 401,
      code: "session_expired",
    });
    await expect(apiCall("/api/expired", {})).rejects.toMatchObject({
      status: 401,
      code: "session_expired",
    });
    expect(reload).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it("sends GET query params and omits undefined values", async () => {
    server.use(
      http.get("/api/search", ({ request }) => {
        const url = new URL(request.url);
        return HttpResponse.json({
          q: url.searchParams.get("q"),
          hasLimit: url.searchParams.has("limit"),
        });
      }),
    );

    await expect(
      apiGet("/api/search", { q: "test", limit: undefined }),
    ).resolves.toEqual({
      q: "test",
      hasLimit: false,
    });
  });
});
