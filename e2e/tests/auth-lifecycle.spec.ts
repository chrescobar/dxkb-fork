import { test, expect } from "../mocks/backends";
import { AuthSessionPage, SignInPage } from "../pages";

test.describe("auth lifecycle (local identity fake)", () => {
  test.describe.configure({ mode: "serial" });
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
