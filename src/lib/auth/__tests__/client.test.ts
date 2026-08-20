import { http, HttpResponse } from "msw";

import { server } from "@/test-helpers/msw-server";
import {
  changePassword,
  exitImpersonation,
  getProfile,
  requestPasswordReset,
  sendVerificationEmail,
  signIn,
  signUp,
  startImpersonation,
  updateProfile,
} from "@/lib/auth/client";

const user = { id: "alice", username: "alice", email: "alice@example.test" };
const signupInput = {
  email: "alice@example.test",
  username: "alice",
  first_name: "Alice",
  last_name: "Example",
  password: "password",
  password_repeat: "password",
};
const profile = {
  creation_date: "2026-01-01",
  email: "alice@example.test",
  email_verified: true,
  first_name: "Alice",
  last_name: "Example",
  id: "alice",
  l_id: "alice",
  last_login: "2026-01-01",
  organisms: "",
  reverification: false,
  source: "BV-BRC",
};

describe("auth client", () => {
  it("signs in with credentials and unwraps the user", async () => {
    server.use(
      http.post("/api/auth/sign-in/email", async ({ request }) => {
        expect(request.credentials).toBe("include");
        expect(await request.json()).toEqual({
          username: "alice",
          password: "password",
        });
        return HttpResponse.json({ user, session: null });
      }),
    );

    await expect(
      signIn({ username: "alice", password: "password" }),
    ).resolves.toEqual(user);
  });

  it("signs up with the submitted profile and unwraps the user", async () => {
    server.use(
      http.post("/api/auth/sign-up/email", async ({ request }) => {
        expect(request.credentials).toBe("include");
        expect(request.headers.get("Content-Type")).toBe("application/json");
        expect(await request.json()).toEqual(signupInput);
        return HttpResponse.json({ user });
      }),
    );

    await expect(signUp(signupInput)).resolves.toEqual(user);
  });

  it.each([
    {
      name: "requests a password reset",
      endpoint: "/api/auth/forget-password",
      body: { usernameOrEmail: "alice@example.test" },
      invoke: () => requestPasswordReset("alice@example.test"),
    },
    {
      name: "sends a verification email without a body",
      endpoint: "/api/auth/send-verification-email",
      body: undefined,
      invoke: () => sendVerificationEmail(),
    },
    {
      name: "changes the password",
      endpoint: "/api/auth/change-password",
      body: { currentPassword: "old-password", newPassword: "new-password" },
      invoke: () => changePassword("old-password", "new-password"),
    },
  ])("$name with the expected request", async ({ endpoint, body, invoke }) => {
    server.use(
      http.post(endpoint, async ({ request }) => {
        expect(request.credentials).toBe("include");
        expect(request.headers.get("Content-Type")).toBe("application/json");
        expect(await request.text()).toBe(
          body === undefined ? "" : JSON.stringify(body),
        );
        return HttpResponse.json({ success: true });
      }),
    );

    await invoke();
  });

  it("gets the profile with included credentials", async () => {
    server.use(
      http.get("/api/auth/profile", ({ request }) => {
        expect(request.credentials).toBe("include");
        return HttpResponse.json(profile);
      }),
    );

    await expect(getProfile()).resolves.toEqual(profile);
  });

  it("posts profile patches with included credentials", async () => {
    const patches = [{ op: "replace", path: "/first_name", value: "Alicia" }];
    server.use(
      http.post("/api/auth/profile", async ({ request }) => {
        expect(request.credentials).toBe("include");
        expect(request.headers.get("Content-Type")).toBe("application/json");
        expect(await request.json()).toEqual(patches);
        return HttpResponse.json({ success: true });
      }),
    );

    await updateProfile(patches);
  });

  it("uses retained SU endpoints", async () => {
    server.use(
      http.post("/api/auth/su-login", async ({ request }) => {
        expect(await request.json()).toEqual({
          targetUser: "bob",
          password: "admin-password",
        });
        return HttpResponse.json({ user: { ...user, username: "bob" } });
      }),
      http.post("/api/auth/su-exit", () => HttpResponse.json({ user })),
    );

    await expect(
      startImpersonation("bob", "admin-password"),
    ).resolves.toMatchObject({ username: "bob" });
    await expect(exitImpersonation()).resolves.toEqual(user);
  });

  it.each([
    {
      name: "sign-up",
      method: "post" as const,
      endpoint: "/api/auth/sign-up/email",
      invoke: () => signUp(signupInput),
    },
    {
      name: "password reset",
      method: "post" as const,
      endpoint: "/api/auth/forget-password",
      invoke: () => requestPasswordReset("alice"),
    },
    {
      name: "verification send",
      method: "post" as const,
      endpoint: "/api/auth/send-verification-email",
      invoke: () => sendVerificationEmail(),
    },
    {
      name: "password change",
      method: "post" as const,
      endpoint: "/api/auth/change-password",
      invoke: () => changePassword("old-password", "new-password"),
    },
    {
      name: "profile get",
      method: "get" as const,
      endpoint: "/api/auth/profile",
      invoke: () => getProfile(),
    },
    {
      name: "profile update",
      method: "post" as const,
      endpoint: "/api/auth/profile",
      invoke: () => updateProfile([]),
    },
  ])(
    "parses a $name endpoint error envelope",
    async ({ method, endpoint, invoke }) => {
      server.use(
        http[method](endpoint, () =>
          HttpResponse.json(
            { error: "Session unavailable", code: "service_unavailable" },
            { status: 503 },
          ),
        ),
      );

      await expect(invoke()).rejects.toMatchObject({
        message: "Session unavailable",
        status: 503,
        code: "service_unavailable",
      });
    },
  );
});
