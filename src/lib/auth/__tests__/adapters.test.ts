import { http, HttpResponse } from "msw";
import { server } from "@/test-helpers/msw-server";
import { httpAuthAdapter } from "@/lib/auth/adapters/http";
import { memoryAuthAdapter } from "@/lib/auth/adapters/memory";

describe("httpAuthAdapter", () => {
  const adapter = httpAuthAdapter();

  it("signIn returns user on 200", async () => {
    server.use(
      http.post("/api/auth/sign-in/email", async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(body).toEqual({ username: "alice", password: "pw" });
        return HttpResponse.json({
          user: { username: "alice", email: "a@x.com", token: "" },
          session: { token: "", expiresAt: new Date().toISOString() },
        });
      }),
    );

    const result = await adapter.signIn({ username: "alice", password: "pw" });
    expect(result.error).toBeNull();
    expect(result.data?.username).toBe("alice");
  });

  it("signIn maps 401 to invalid_credentials", async () => {
    server.use(
      http.post("/api/auth/sign-in/email", () =>
        HttpResponse.json({ message: "Invalid credentials" }, { status: 401 }),
      ),
    );

    const result = await adapter.signIn({ username: "alice", password: "x" });
    expect(result.data).toBeNull();
    expect(result.error?.code).toBe("invalid_credentials");
    expect(result.error?.message).toBe("Invalid credentials");
  });

  it("signIn maps 503 to service_unavailable", async () => {
    server.use(
      http.post("/api/auth/sign-in/email", () =>
        HttpResponse.json({ message: "Down" }, { status: 503 }),
      ),
    );

    const result = await adapter.signIn({ username: "alice", password: "x" });
    expect(result.error?.code).toBe("service_unavailable");
  });

  it("getSession returns null user without error when route reports no session", async () => {
    server.use(
      http.get("/api/auth/get-session", () =>
        HttpResponse.json({ user: null, session: null }),
      ),
    );

    const result = await adapter.getSession();
    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });

  it("impersonate and exitImpersonation hit the SU endpoints", async () => {
    server.use(
      http.post("/api/auth/su-login", () =>
        HttpResponse.json({
          user: {
            username: "bob",
            email: "",
            token: "",
            isImpersonating: true,
            originalUsername: "alice",
          },
          session: { token: "", expiresAt: new Date().toISOString() },
        }),
      ),
      http.post("/api/auth/su-exit", () =>
        HttpResponse.json({
          user: { username: "alice", email: "", token: "" },
          session: { token: "", expiresAt: new Date().toISOString() },
        }),
      ),
    );

    const imp = await adapter.impersonate("bob", "pw");
    expect(imp.data?.username).toBe("bob");
    expect(imp.data?.isImpersonating).toBe(true);

    const back = await adapter.exitImpersonation();
    expect(back.data?.username).toBe("alice");
  });
});

describe("memoryAuthAdapter", () => {
  it("signs in with a seeded account", async () => {
    const user = { username: "alice", email: "a@x.com", token: "" };
    const adapter = memoryAuthAdapter({ accounts: [{ user, password: "pw" }] });
    const ok = await adapter.signIn({ username: "alice", password: "pw" });
    expect(ok.data).toEqual(user);
    const bad = await adapter.signIn({ username: "alice", password: "wrong" });
    expect(bad.error?.code).toBe("invalid_credentials");
  });

  it("impersonate requires an active session", async () => {
    const adapter = memoryAuthAdapter({
      accounts: [
        { user: { username: "bob", email: "", token: "" }, password: "pw" },
      ],
    });
    const result = await adapter.impersonate("bob", "pw");
    expect(result.error?.code).toBe("unauthorized");
  });
});
