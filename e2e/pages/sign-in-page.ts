import { expect, type Page, type Locator } from "@playwright/test";

/**
 * Page object for the /sign-in route. Wraps the form selectors and the common
 * interactions (fill, submit, assert errors) so specs describe intent rather
 * than selector plumbing.
 */
export class SignInPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly heading: Locator;
  readonly alert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByPlaceholder(/username or email/i);
    this.passwordInput = page.getByPlaceholder(/enter your password/i);
    this.submitButton = page.getByRole("button", { name: /^sign in$/i });
    this.heading = page.getByText(/sign in to dxkb/i);
    // Scope to the shadcn Alert component; getByRole("alert") also matches
    // Next.js's hidden #__next-route-announcer__ and triggers strict-mode failures.
    this.alert = page.locator('[role="alert"][data-slot="alert"]');
  }

  async goto(redirect?: string, baseURL = ""): Promise<void> {
    const path = redirect
      ? `/sign-in?redirect=${encodeURIComponent(redirect)}`
      : "/sign-in";
    await this.page.goto(`${baseURL}${path}`);
    await expect(this.heading).toBeVisible();
  }

  async waitUntilInteractive(timeout = 30_000): Promise<void> {
    await this.submitButton.waitFor({ state: "visible", timeout });
    await expect(this.submitButton).toBeEnabled({ timeout });
  }

  async fill(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async expectInlineError(text: string | RegExp): Promise<void> {
    await expect(this.alert).toContainText(text);
  }

  async expectValidationError(text: string | RegExp): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible();
  }
}
