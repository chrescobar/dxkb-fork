import { expect, type Locator, type Page } from "@playwright/test";

export class OrganismLandingPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(slug: string): Promise<void> {
    await this.page.goto(`/organisms/${slug}`);
    await expect(this.page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  getKpi(label: string): Locator {
    return this.page.locator('[data-testid^="organism-kpi-"]').filter({ hasText: label });
  }

  getGenusCard(name: string): Locator {
    return this.page.getByRole("link", { name: `View ${name} genomes` });
  }

  expectDonut(title: string): Promise<void> {
    return expect(this.page.getByRole("img", { name: `${title} distribution` })).toBeVisible();
  }
}
