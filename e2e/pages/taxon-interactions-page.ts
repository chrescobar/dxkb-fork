import { expect, type Page } from "@playwright/test";

export class TaxonInteractionsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(taxonId: string): Promise<void> {
    await this.page.goto(`/taxonomy/${taxonId}?tab=interactions`);
    await expect(this.page).toHaveURL(/tab=interactions/);
  }

  async expectResultCount(text: string): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible({ timeout: 10_000 });
  }

  async expectInteractor(interactor: string): Promise<void> {
    await expect(this.page.getByText(interactor)).toBeVisible();
  }

  async expectTab(name: string): Promise<void> {
    await expect(this.page.getByRole("button", { name })).toBeVisible();
  }

  async switchToGraph(): Promise<void> {
    await this.page.getByRole("tab", { name: "Graph" }).click();
  }

  async switchToTable(): Promise<void> {
    await this.page.getByRole("tab", { name: "Table" }).click();
  }

  async expectCanvasVisible(): Promise<void> {
    await expect(this.page.getByRole("tabpanel", { name: "Graph" }).locator("canvas").first()).toBeVisible();
  }

  async expectEmptyGraphState(): Promise<void> {
    await expect(this.page.getByText("No interactions found.")).toBeVisible();
  }

  /** Table subview's own FilterBar keyword box (top of the Table tabpanel). */
  async filterByKeyword(text: string): Promise<void> {
    await this.page
      .getByRole("tabpanel", { name: "Table" })
      .getByPlaceholder("Search keywords...")
      .fill(text);
  }

  /** Graph subview's keyword box, rendered in its own GraphToolbar. */
  async filterGraphByKeyword(text: string): Promise<void> {
    await this.page
      .getByRole("tabpanel", { name: "Graph" })
      .getByPlaceholder("Search keywords...")
      .fill(text);
  }

  async expectTableKeywordValue(text: string): Promise<void> {
    await expect(
      this.page.getByRole("tabpanel", { name: "Table" }).getByPlaceholder("Search keywords..."),
    ).toHaveValue(text);
  }

  async expectGraphKeywordValue(text: string): Promise<void> {
    await expect(
      this.page.getByRole("tabpanel", { name: "Graph" }).getByPlaceholder("Search keywords..."),
    ).toHaveValue(text);
  }
}
