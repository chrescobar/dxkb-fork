import type { Page } from "@playwright/test";

export interface SettleOptions {
  /**
   * Load state to wait for. Defaults to "networkidle".
   * Use "domcontentloaded" for pages with continuous RSC prefetch cycles
   * that prevent networkidle from ever being reached.
   */
  loadState?: "load" | "domcontentloaded" | "networkidle";
  /** Extra ms after load state + fonts.ready. For streaming/animated routes. */
  extraMs?: number;
  /** Selector that must detach before scanning (zero-skeleton contract). */
  skeletonSelector?: string;
}

/**
 * Wait for a stable page state before running axe:
 *   1. networkidle  — no in-flight requests for 500ms
 *   2. fonts.ready  — prevents false-positive contrast failures from unloaded fonts
 *   3. Skeleton gone — avoids scanning transient loading states
 */
export async function awaitSettled(page: Page, options: SettleOptions = {}): Promise<void> {
  await page.waitForLoadState(options.loadState ?? "networkidle");
  await page.evaluate(() => document.fonts.ready);
  if (options.skeletonSelector) {
    await page.waitForSelector(options.skeletonSelector, { state: "detached", timeout: 10_000 });
  }
  if (options.extraMs) {
    await page.waitForTimeout(options.extraMs);
  }
}
