import type { Page } from "@playwright/test";

export type Theme = "dxkb-light" | "dxkb-dark";
export const allThemes: Theme[] = ["dxkb-light", "dxkb-dark"];

/**
 * Apply a theme by setting data-theme on <html>.
 * CSS custom properties respond synchronously — no additional settle needed.
 */
export async function setTheme(page: Page, theme: Theme): Promise<void> {
  await page.evaluate((t: string) => {
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.classList.remove("dxkb-light", "dxkb-dark");
    document.documentElement.classList.add(t);
  }, theme);
}

/**
 * Run a scan callback once per theme (light → dark).
 *
 *   await forEachTheme(page, async (theme) => {
 *     const violations = await scanPage(page);
 *     // assert ...
 *   });
 */
export async function forEachTheme(
  page: Page,
  callback: (theme: Theme) => Promise<void>,
): Promise<void> {
  for (const theme of allThemes) {
    await setTheme(page, theme);
    await callback(theme);
  }
}
