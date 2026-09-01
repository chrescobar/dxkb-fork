import { expect, type Page } from "@playwright/test";

export class ResourceCollectionPage {
  constructor(
    readonly page: Page,
    readonly route: string,
    readonly resource: string,
    readonly selectedId: string,
    readonly detailText: string,
  ) {}

  async goto(keyword: string) {
    await this.page.goto(`/${this.route}?keyword=${encodeURIComponent(keyword)}`);
    await expect(
      this.page.getByRole("checkbox", { name: `Select row ${this.selectedId}` }),
    ).toBeVisible();
  }

  async selectRow() {
    await this.page
      .getByRole("checkbox", { name: `Select row ${this.selectedId}` })
      .check();
    await expect(this.page.getByText("1 selected", { exact: true })).toBeVisible();
    await expect(this.page.getByRole("button", { name: "Hide" })).toBeVisible();
    await expect(this.page.getByText(this.detailText, { exact: true }).first()).toBeVisible();
  }

  async goToPage(pageNumber: number) {
    await this.page
      .getByRole("navigation", { name: `${this.resource} results pagination` })
      .getByRole("button", { name: String(pageNumber), exact: true })
      .click();
    if (pageNumber === 1) {
      await expect(this.page).not.toHaveURL(/[?&]page=/);
    } else {
      await expect(this.page).toHaveURL(
        new RegExp(`[?&]page=${String(pageNumber)}(?:&|$)`),
      );
    }
  }

  async expectSelectionPreserved() {
    await expect(this.page.getByText("1 selected", { exact: true })).toBeVisible();
    await expect(this.page.getByRole("button", { name: "Hide" })).toBeVisible();
    await expect(this.page.getByText(this.detailText, { exact: true }).first()).toBeVisible();
  }

  async expectSelectedRowChecked() {
    await expect(
      this.page.getByRole("checkbox", { name: `Select row ${this.selectedId}` }),
    ).toBeChecked();
  }
}
