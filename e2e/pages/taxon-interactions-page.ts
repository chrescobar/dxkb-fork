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
}
