import { createAuthStore } from "@/lib/auth/store";
import { memoryAuthAdapter } from "@/lib/auth/adapters/memory";
import type { AuthUser } from "@/lib/auth/types";

const alice: AuthUser = {
  username: "alice",
  email: "alice@example.com",
  token: "t-alice",
  email_verified: true,
};
const bob: AuthUser = {
  username: "bob",
  email: "bob@example.com",
  token: "t-bob",
  email_verified: true,
  roles: ["admin"],
};

describe("createAuthStore", () => {
  it("hydrates to authed when the port returns a user", async () => {
    const port = memoryAuthAdapter({ initialSession: alice });
    const store = createAuthStore({ port });

    expect(store.snapshot().status).toBe("loading");
    await store.refresh();

    expect(store.snapshot()).toEqual({ user: alice, status: "authed" });
  });

  it("falls to guest when the port returns null", async () => {
    const port = memoryAuthAdapter({ initialSession: null });
    const store = createAuthStore({ port });
    await store.refresh();
    expect(store.snapshot()).toEqual({ user: null, status: "guest" });
  });

  it("notifies subscribers on state changes", async () => {
    const port = memoryAuthAdapter({
      accounts: [{ user: alice, password: "pw" }],
    });
    const store = createAuthStore({ port });
    const listener = vi.fn();
    store.subscribe(listener);

    await store.signIn({ username: "alice", password: "pw" });

    expect(listener).toHaveBeenCalled();
    expect(store.snapshot().user).toEqual(alice);
  });

  it("emits session:acquired on sign-in", async () => {
    const port = memoryAuthAdapter({
      accounts: [{ user: alice, password: "pw" }],
    });
    const store = createAuthStore({ port });
    const handler = vi.fn();
    store.events.on("session:acquired", handler);

    await store.signIn({ username: "alice", password: "pw" });

    expect(handler).toHaveBeenCalledWith({ user: alice, via: "signIn" });
  });

  it("emits session:lost on signOut with reason", async () => {
    const port = memoryAuthAdapter({ initialSession: alice });
    const store = createAuthStore({ port, initialUser: alice });
    await store.refresh();

    const handler = vi.fn();
    store.events.on("session:lost", handler);

    await store.signOut("expired");

    expect(handler).toHaveBeenCalledWith({ reason: "expired" });
    expect(store.snapshot()).toEqual({ user: null, status: "guest" });
  });

  it("coalesces concurrent refresh calls", async () => {
    const port = memoryAuthAdapter({ initialSession: alice });
    const spy = vi.spyOn(port, "getSession");
    const store = createAuthStore({ port });

    await Promise.all([store.refresh(), store.refresh(), store.refresh()]);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("supports impersonate round-trip", async () => {
    const port = memoryAuthAdapter({
      accounts: [
        { user: alice, password: "pw" },
        { user: bob, password: "pw" },
      ],
    });
    const store = createAuthStore({ port });
    await store.signIn({ username: "alice", password: "pw" });

    const impersonated = await store.impersonate("bob", "pw");
    expect(impersonated.data?.username).toBe("bob");
    expect(store.snapshot().user?.isImpersonating).toBe(true);
    expect(store.snapshot().user?.originalUsername).toBe("alice");

    const restored = await store.exitImpersonation();
    expect(restored.data?.username).toBe("alice");
    expect(store.snapshot().user?.isImpersonating).toBeFalsy();
  });
});

describe("authenticatedFetch", () => {
  it("returns the response directly when not 401", async () => {
    const onRequest = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    const port = memoryAuthAdapter({ initialSession: alice, onRequest });
    const store = createAuthStore({ port, initialUser: alice });

    const response = await store.authenticatedFetch("/api/items");
    expect(response.status).toBe(200);
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it("retries once after refresh on 401", async () => {
    let call = 0;
    const onRequest = vi.fn().mockImplementation(async () => {
      call++;
      return new Response(null, { status: call === 1 ? 401 : 200 });
    });
    const port = memoryAuthAdapter({ initialSession: alice, onRequest });
    const refreshSpy = vi.spyOn(port, "getSession");
    const store = createAuthStore({ port, initialUser: alice });

    const response = await store.authenticatedFetch("/api/items");

    expect(response.status).toBe(200);
    expect(onRequest).toHaveBeenCalledTimes(2);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it("returns the original 401 when refresh drops the session", async () => {
    const onRequest = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 401 }));
    const port = memoryAuthAdapter({ initialSession: alice, onRequest });
    port.setSession(null);
    const store = createAuthStore({ port, initialUser: alice });

    const response = await store.authenticatedFetch("/api/items");

    expect(response.status).toBe(401);
    expect(store.snapshot().status).toBe("guest");
    expect(onRequest).toHaveBeenCalledTimes(1);
  });
});
