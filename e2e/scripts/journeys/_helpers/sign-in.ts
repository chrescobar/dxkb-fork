import type { Page } from "@playwright/test";

import { SignInPage } from "../../../pages";
import type { JourneyEnv } from "../../record-har";

/**
 * Drives the sign-in form with the BV-BRC test account and waits until
 * `/api/auth/sign-in/email` resolves and the post-auth network settles.
 *
 * Shared by every signed-in journey driver (`workspace-*`, `jobs-*`,
 * `service-*`). Keeps the auth flow in one place so when the form changes,
 * only this helper needs updating; individual journey drivers stay focused
 * on the surface they capture.
 *
 */
export async function signIn(page: Page, env: JourneyEnv): Promise<void> {
  const { baseURL, user, password } = env;
  if (!user || !password) {
    throw new Error(
      "E2E_TEST_USER / E2E_TEST_PASSWORD must be set in .env.e2e",
    );
  }

  const signInPage = new SignInPage(page);
  await signInPage.goto(undefined, baseURL);
  await signInPage.waitUntilInteractive();
  await signInPage.fill(user, password);

  await signInPage.submitAndWaitForResponse();

  // Settle post-auth redirects and downstream requests so they land in the HAR too.
  await page.waitForLoadState("networkidle", { timeout: 30_000 });
}

/**
 * Read the canonical user id established by profile validation during sign-in.
 */
export async function getUserId(page: Page): Promise<string> {
  const cookies = await page.context().cookies();
  const raw = cookies.find((c) => c.name === "bvbrc_user_id")?.value;
  if (!raw) {
    throw new Error(
      "bvbrc_user_id cookie not set after sign-in — sign-in likely failed. " +
        "Check the recorder log above for a 4xx/5xx on /api/auth/sign-in/email.",
    );
  }
  return raw;
}
