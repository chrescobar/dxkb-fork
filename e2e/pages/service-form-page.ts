import { expect, type Page, type Locator } from "@playwright/test";

/**
 * Page object for bioinformatics service forms (e.g. `/services/genome-assembly`).
 * Specs that need to drive a form interaction not covered here should reach for the underlying
 * Playwright `page` directly rather than expanding this object with helpers that no real test
 * exercises — the WorkspaceObjectSelector in particular has too many service-specific quirks
 * (async dropdowns, portal listboxes, paired vs. single inputs) for a single shared helper.
 */
export class ServiceFormPage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page, headingText: string | RegExp) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1, name: headingText });
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await expect(this.heading).toBeVisible();
  }

  /** Click the primary submit button by its visible label. */
  async submit(submitLabel: string | RegExp): Promise<void> {
    await this.page.getByRole("button", { name: submitLabel }).click();
  }

  /**
   * Persist debug mode in localStorage so the form short-circuits to
   * JobParamsDialog on submit instead of POSTing. Must be called BEFORE
   * `goto(...)` — `addInitScript` only fires on subsequent navigations.
   *
   * See `ServiceDebuggingProvider` for the hydration code path.
   */
  async enableDebugMode(): Promise<void> {
    await this.page.addInitScript(() => {
      window.localStorage.setItem("dxkb:service-debug-mode", "true");
    });
  }

  /**
   * Seed a `useRerunForm` payload in sessionStorage under the given key
   * (default: `"e2e-rerun"`). The spec must then navigate with
   * `?rerun_key=<key>` so the form hydrates the declared `rerun.fields` +
   * `rerun.libraries` from this payload on mount.
   *
   * Must be called BEFORE `goto(...)`.
   */
  async seedRerun(
    payload: Record<string, unknown>,
    key = "e2e-rerun",
  ): Promise<void> {
    await this.page.addInitScript(
      ([k, v]) => {
        sessionStorage.setItem(k, v);
      },
      [key, JSON.stringify(payload)] as const,
    );
  }

  /**
   * Read the JSON payload out of the `JobParamsDialog` that debug mode
   * opens on submit. The dialog title is `"<serviceName> Submission Params:"`
   * where `serviceName` is the JSON-RPC service identifier (NOT the
   * human-readable displayName) — for genome-assembly this is
   * `"GenomeAssembly2"`, not `"Genome Assembly"`. Look up the value from
   * the service's `createServiceDefinition({ serviceName, … })` call.
   *
   * Asserts the dialog is visible, then JSON-parses the `<pre>` text.
   */
  async readSubmittedParams(
    serviceName: string,
  ): Promise<Record<string, unknown>> {
    const escaped = serviceName.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const dialog = this.page.getByRole("dialog", {
      name: new RegExp(`${escaped}\\s+Submission Params`, "i"),
    });
    await expect(dialog).toBeVisible();
    const json = await dialog.locator("pre").innerText();
    return JSON.parse(json) as Record<string, unknown>;
  }
}
