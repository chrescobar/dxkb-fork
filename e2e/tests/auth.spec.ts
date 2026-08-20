import {
  test,
  expect,
  applyBackendMocks,
  bvbrcCookies,
} from "../mocks/backends";
import {
  journeyOverrides,
  workspacePopulatedOverrides,
} from "../fixtures/overrides";
import {
  AuthSessionPage,
  SignInPage,
  ForgotPasswordPage,
  SignUpPage,
} from "../pages";

// Auth mutations share one loopback identity backend; serialize this file so
// interception-heavy contract tests cannot contend with real lifecycle flows.
test.describe.configure({ mode: "serial" });

test.describe("auth (signed out)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("sign-in page renders with form fields", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...journeyOverrides],
    });
    const signIn = new SignInPage(page);
    await signIn.goto();
    await expect(signIn.usernameInput).toBeVisible();
    await expect(signIn.passwordInput).toBeVisible();
    await expect(signIn.submitButton).toBeVisible();
  });

  test("preserves redirect query param", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...journeyOverrides],
    });
    const signIn = new SignInPage(page);
    await signIn.goto("/workspace");
    await expect(page).toHaveURL(/redirect=%2Fworkspace/);
  });

  test("short password shows zod validation error", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [...journeyOverrides],
    });
    const signIn = new SignInPage(page);
    await signIn.goto();
    await signIn.fill("e2e@example.com", "short");
    await signIn.submit();
    await signIn.expectValidationError(/at least 8 characters/i);
  });

  test("submits the canonical sign-in request", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [
        {
          url: "/api/auth/sign-in/email",
          method: "POST",
          body: {
            user: {
              id: "e2e-test-user@patricbrc.org",
              username: "e2e-test-user@patricbrc.org",
              email: "e2e@example.com",
              email_verified: true,
            },
            session: { token: "", expiresAt: "2099-01-01T00:00:00Z" },
          },
        },
        // Workspace.get (favorites) and Workspace.ls fire on the post-sign-in landing page.
        ...workspacePopulatedOverrides,
        ...journeyOverrides,
      ],
    });
    const signIn = new SignInPage(page);
    await signIn.goto("/forgot-password");

    const signInRequest = page.waitForRequest(
      (req) =>
        req.url().endsWith("/api/auth/sign-in/email") &&
        req.method() === "POST",
    );
    await signIn.fill("e2e-test-user", "password1234");
    await signIn.submit();
    const req = await signInRequest;
    expect(req.postDataJSON()).toMatchObject({
      username: "e2e-test-user",
      password: "password1234",
    });
    // This request-shape test intercepts the app endpoint, so it deliberately does
    // not assert server-authoritative navigation or cookies. The real lifecycle
    // scenarios below cover those behaviors without interception.
  });

  // Same flow as the test above but driven by the recorded `auth-sign-in.har` instead
  // of a hand-written override. Catches drift between the test fixture and the real
  // BV-BRC sign-in response shape — re-record via `pnpm e2e:record auth-sign-in`
  // when the contract changes (the bi-weekly workflow runs this automatically).
  test("submits credentials via recorded HAR replay", async ({ page }) => {
    // No `permissiveBackendOverrides` here: those have a `/\/api\/auth\//` POST
    // catch-all that would intercept the sign-in call before HAR replay sees it,
    // returning `{}` instead of the recorded session payload. The HAR itself
    // covers `/api/auth/sign-in/email` and its post-sign-in navigation.
    await applyBackendMocks(page, {
      har: "auth-sign-in.har",
    });
    const signIn = new SignInPage(page);
    await signIn.goto();

    const signInResponse = page.waitForResponse(
      (res) =>
        res.url().endsWith("/api/auth/sign-in/email") &&
        res.request().method() === "POST",
    );
    await signIn.fill("e2e-test-user", "REDACTED-PASSWORD");
    await signIn.submit();
    const res = await signInResponse;
    const body = (await res.json()) as { user: unknown; session: unknown };
    expect(body.user).toMatchObject({
      username: "e2e-test-user",
      realm: "bvbrc",
      email_verified: true,
    });
    expect(body.session).toHaveProperty("expiresAt");
  });

  test("surfaces backend error on invalid credentials", async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [
        {
          url: "/api/auth/sign-in/email",
          method: "POST",
          status: 401,
          body: { message: "Invalid username or password" },
        },
        ...journeyOverrides,
      ],
    });
    const signIn = new SignInPage(page);
    await signIn.goto();
    await signIn.fill("e2e-test-user", "wrong-password");
    await signIn.submit();
    await signIn.expectInlineError(/invalid username or password/i);
  });

  test("forgot-password submit POSTs the entered identifier and shows the check-your-email card", async ({
    page,
  }) => {
    await applyBackendMocks(page, {
      overrides: [
        {
          // Successful password reset — server returns { success: true, message: "..." }
          url: "/api/auth/forget-password",
          method: "POST",
          body: {
            success: true,
            message: "Password reset email sent successfully",
          },
        },
        ...journeyOverrides,
      ],
    });
    const forgot = new ForgotPasswordPage(page);
    await forgot.goto();
    await forgot.fill("e2e@example.com");

    const forgetRequest = page.waitForRequest(
      (req) =>
        req.url().endsWith("/api/auth/forget-password") &&
        req.method() === "POST",
    );
    await forgot.submit();
    const req = await forgetRequest;
    // The concrete auth client sends the route's canonical request shape.
    const body = req.postDataJSON() as { usernameOrEmail: string };
    expect(body.usernameOrEmail).toBe("e2e@example.com");

    await expect(forgot.successCardTitle).toBeVisible();
  });

  test("forgot-password surfaces the generic error when the reset call fails", async ({
    page,
  }) => {
    await applyBackendMocks(page, {
      overrides: [
        {
          // Failed password reset — server returns 400 with an error message
          url: "/api/auth/forget-password",
          method: "POST",
          status: 400,
          body: { success: false, message: "User not found" },
        },
        ...journeyOverrides,
      ],
    });
    const forgot = new ForgotPasswordPage(page);
    await forgot.goto();
    await forgot.fill("missing@example.com");
    await forgot.submit();
    // The page swallows the upstream message and shows a generic error.
    await expect(forgot.errorAlert).toBeVisible();
  });

  test("sign-up submits all required fields and shows the success toast", async ({
    page,
  }) => {
    await applyBackendMocks(page, {
      overrides: [
        {
          // Successful sign-up — respondWithSession unwraps the returned user + session.
          url: "/api/auth/sign-up/email",
          method: "POST",
          body: {
            user: {
              id: "new-user@patricbrc.org",
              username: "new-user@patricbrc.org",
              email: "new@example.com",
              email_verified: false,
            },
            session: {
              token: "",
              expiresAt: "2099-01-01T00:00:00Z",
            },
          },
        },
        // The form redirects after sign-up, which fires workspace RPC calls on the home page.
        ...workspacePopulatedOverrides,
        ...journeyOverrides,
      ],
    });
    const signUp = new SignUpPage(page);
    await signUp.goto();
    await signUp.fillRequired({
      firstName: "Eve",
      lastName: "Tester",
      username: "new-user",
      email: "new@example.com",
      password: "password1234",
    });

    const signUpRequest = page.waitForRequest(
      (req) =>
        req.url().endsWith("/api/auth/sign-up/email") &&
        req.method() === "POST",
    );
    await signUp.submit();
    const req = await signUpRequest;
    // Wire shape is SignupCredentials — snake_case keys match the BV-BRC backend contract.
    expect(req.postDataJSON()).toMatchObject({
      email: "new@example.com",
      username: "new-user",
      first_name: "Eve",
      last_name: "Tester",
      password: "password1234",
      password_repeat: "password1234",
    });

    await expect(signUp.successToast).toBeVisible();
  });

  test("sign-up surfaces the upstream error message on conflict", async ({
    page,
  }) => {
    await applyBackendMocks(page, {
      overrides: [
        {
          // 409 conflict — the page surfaces the upstream message verbatim.
          url: "/api/auth/sign-up/email",
          method: "POST",
          status: 409,
          body: { message: "Username already taken" },
        },
        ...journeyOverrides,
      ],
    });
    const signUp = new SignUpPage(page);
    await signUp.goto();
    await signUp.fillRequired({
      firstName: "Eve",
      lastName: "Tester",
      username: "duplicate-user",
      email: "dup@example.com",
      password: "password1234",
    });
    await signUp.submit();
    // Unlike forgot-password, sign-up surfaces the upstream message (not a generic fallback).
    await expect(
      page.locator('[data-slot="alert"]').getByText(/username already taken/i),
    ).toBeVisible();
  });

  test("unauthenticated visit to /workspace redirects to sign-in", async ({
    page,
  }) => {
    await applyBackendMocks(page, {
      overrides: [...journeyOverrides],
    });
    await page.goto("/workspace");
    await expect(page).toHaveURL(/sign-in\?redirect=/);
  });

  test("unauthenticated visit to /jobs redirects to sign-in", async ({
    page,
  }) => {
    await applyBackendMocks(page, {
      overrides: [...journeyOverrides],
    });
    await page.goto("/jobs");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated visit to /settings redirects to sign-in", async ({
    page,
  }) => {
    await applyBackendMocks(page, {
      overrides: [...journeyOverrides],
    });
    await page.goto("/settings");
    await expect(page).toHaveURL(/sign-in/);
  });
});

test.describe("auth lifecycle (local identity fake)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("signs in through the app handler and signs out through the Server Action", async ({
    page,
    context,
  }) => {
    const sessionCookieNames = ["bvbrc_token", "bvbrc_user_id", "bvbrc_realm"];
    const allAuthCookieNames = [
      ...sessionCookieNames,
      "bvbrc_su_original_token",
      "bvbrc_su_original_user_id",
      "bvbrc_su_original_realm",
      "bvbrc_user_profile",
    ];

    expect(
      (await context.cookies()).filter((cookie) =>
        allAuthCookieNames.includes(cookie.name),
      ),
    ).toEqual([]);

    const signIn = new SignInPage(page);
    const authSession = new AuthSessionPage(page);
    await signIn.goto("/settings");
    await signIn.fill("e2e-test-user", "password1234");

    const signInResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/sign-in/email") &&
        response.request().method() === "POST",
    );
    await page.evaluate(() => {
      sessionStorage.removeItem("e2e-next-redirect-flash");
      new MutationObserver(() => {
        if (document.body.textContent.includes("NEXT_REDIRECT")) {
          sessionStorage.setItem("e2e-next-redirect-flash", "true");
        }
      }).observe(document.body, { childList: true, subtree: true });
    });
    await signIn.submit();
    expect((await signInResponse).status()).toBe(200);
    await expect(page).toHaveURL(/\/settings$/);
    expect(
      await page.evaluate(() =>
        sessionStorage.getItem("e2e-next-redirect-flash"),
      ),
    ).toBeNull();
    await authSession.expectSignedIn();

    const cookies = await context.cookies();
    const sessionCookies = Object.fromEntries(
      cookies
        .filter((cookie) => sessionCookieNames.includes(cookie.name))
        .map((cookie) => [cookie.name, cookie]),
    );
    expect(Object.keys(sessionCookies).sort()).toEqual(
      [...sessionCookieNames].sort(),
    );
    expect(decodeURIComponent(sessionCookies.bvbrc_token.value)).toBe(
      "un=e2e-test-user@patricbrc.org|e2e-admin-token",
    );
    expect(decodeURIComponent(sessionCookies.bvbrc_user_id.value)).toBe(
      "e2e-test-user@patricbrc.org",
    );
    expect(sessionCookies.bvbrc_realm.value).toBe("patricbrc.org");
    for (const cookie of Object.values(sessionCookies)) {
      expect(cookie).toMatchObject({
        httpOnly: true,
        secure: false,
        sameSite: "Strict",
        path: "/",
      });
      expect(cookie.expires).toBeGreaterThan(Date.now() / 1000);
    }

    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings$/);

    await authSession.signOut();

    await expect(page).toHaveURL(/\/$/);
    await expect
      .poll(async () =>
        (await context.cookies())
          .filter((cookie) => allAuthCookieNames.includes(cookie.name))
          .map((cookie) => cookie.name),
      )
      .toEqual([]);

    await page.goto("/settings");
    await expect(page).toHaveURL(/\/sign-in\?redirect=/);
  });

  test("admin can impersonate a distinct target and restore the original session without app endpoint interception", async ({
    page,
    context,
  }) => {
    const signIn = new SignInPage(page);
    const authSession = new AuthSessionPage(page);
    await signIn.goto();
    await signIn.fill("e2e-test-user", "password1234");
    const signInResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/sign-in/email") &&
        response.request().method() === "POST",
    );
    await signIn.submit();
    expect((await signInResponse).status()).toBe(200);
    await expect(page).toHaveURL((url) => url.pathname === "/");
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings$/);

    const suLoginResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/su-login") &&
        response.request().method() === "POST",
    );
    await authSession.startImpersonation("e2e-target-user", "password1234");
    expect((await suLoginResponse).status()).toBe(200);

    await authSession.expectImpersonating("e2e-target-user");
    const impersonatingCookies = Object.fromEntries(
      (await context.cookies()).map((cookie) => [cookie.name, cookie.value]),
    );
    expect(decodeURIComponent(impersonatingCookies.bvbrc_token)).toBe(
      "un=e2e-target-user@patricbrc.org|e2e-target-token",
    );
    expect(decodeURIComponent(impersonatingCookies.bvbrc_user_id)).toBe(
      "e2e-target-user@patricbrc.org",
    );
    expect(
      decodeURIComponent(impersonatingCookies.bvbrc_su_original_token),
    ).toBe("un=e2e-test-user@patricbrc.org|e2e-admin-token");
    expect(
      decodeURIComponent(impersonatingCookies.bvbrc_su_original_user_id),
    ).toBe("e2e-test-user@patricbrc.org");

    await authSession.expectUserGreeting("e2e-target-user");

    const suExitResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/su-exit") &&
        response.request().method() === "POST",
    );
    await authSession.exitImpersonation();
    expect((await suExitResponse).status()).toBe(200);

    await expect
      .poll(async () => {
        const cookies = Object.fromEntries(
          (await context.cookies()).map((cookie) => [
            cookie.name,
            cookie.value,
          ]),
        );
        return {
          token: decodeURIComponent(cookies.bvbrc_token),
          userId: decodeURIComponent(cookies.bvbrc_user_id),
          originalToken: cookies.bvbrc_su_original_token,
          originalUserId: cookies.bvbrc_su_original_user_id,
        };
      })
      .toEqual({
        token: "un=e2e-test-user@patricbrc.org|e2e-admin-token",
        userId: "e2e-test-user@patricbrc.org",
        originalToken: undefined,
        originalUserId: undefined,
      });

    await authSession.expectUserGreeting("e2e-test-user");
    await authSession.expectSuLoginAvailable();
  });
});

test.describe("auth (signed in)", () => {
  test("signs out via avatar dropdown and clears the local session", async ({
    page,
    context,
  }) => {
    await applyBackendMocks(page, {
      overrides: [
        // Workspace.get (favorites) + Workspace.ls fire when /settings loads the workspace sidebar.
        ...workspacePopulatedOverrides,
        ...journeyOverrides,
      ],
    });
    await page.goto("/settings");
    await expect(page).not.toHaveURL(/sign-in/);

    const authSession = new AuthSessionPage(page);
    await authSession.signOut();
    await expect
      .poll(async () =>
        (await context.cookies()).filter((cookie) =>
          bvbrcCookies.some((expected) => expected.name === cookie.name),
        ),
      )
      .toEqual([]);
    const cookies = await context.cookies();
    for (const name of bvbrcCookies.map((cookie) => cookie.name)) {
      expect(cookies.find((cookie) => cookie.name === name)).toBeUndefined();
    }
  });

  test("session cookies are available on signed-in session", async ({
    context,
  }) => {
    const cookies = await context.cookies();
    const names = cookies.map((c) => c.name);
    for (const expected of bvbrcCookies.map((c) => c.name)) {
      expect(names).toContain(expected);
    }
  });
});
