import {
  expect,
  type Locator,
  type Page,
  type Request,
} from "@playwright/test";

export class ProteinStructurePage {
  constructor(readonly page: Page) {}

  async gotoCollection(query = "spike"): Promise<Request> {
    const request = this.page.waitForRequest((candidate) => {
      const url = new URL(candidate.url());
      return (
        url.pathname === "/api/data/protein_structure" &&
        url.searchParams.get("operation") === "collection"
      );
    });
    await this.page.goto(
      `/protein-structure?keyword=${encodeURIComponent(query)}`,
    );
    return request;
  }

  memberLink(accession: string): Locator {
    return this.page.getByRole("link", { name: accession, exact: true });
  }

  async expectCollectionRow(accession: string, title: string): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: "Protein Structures" }),
    ).toBeVisible();
    await expect(this.page.getByText(title, { exact: true })).toBeVisible();
    await expect(this.memberLink(accession)).toHaveAttribute(
      "href",
      `/protein-structure?accession=${accession}`,
    );
  }

  async gotoAccessions(...accessions: string[]): Promise<void> {
    await this.page.goto(
      `/protein-structure?accession=${encodeURIComponent(accessions.join(","))}`,
    );
  }

  async expectMember(accession: string, title?: string): Promise<void> {
    await expect(
      this.page.getByRole("heading", { level: 1, name: accession }),
    ).toBeVisible();
    if (title) {
      await expect(this.page.getByText(title, { exact: true })).toBeVisible();
    }
    await expect(this.page.getByTestId("molstar-container")).toBeVisible();
  }

  accessionSelector(): Locator {
    return this.page.locator('[aria-label="Structure accession selector"]');
  }

  async expectInvalid(message: string): Promise<void> {
    const alert = this.page.getByRole("alert").filter({
      hasText: "Invalid protein structure request",
    });
    await expect(alert).toContainText(message);
    await expect(this.page.getByTestId("molstar-container")).toHaveCount(0);
  }

  async expectLegacyListRedirect(query: string): Promise<void> {
    await this.page.goto(`/view/ProteinStructureList/?${query}`);
    await expect(this.page).toHaveURL(`/protein-structure?${query}`);
  }

  async expectLegacyHashRedirect(accession: string): Promise<void> {
    await this.page.goto(
      `/view/ProteinStructure/#accession=${encodeURIComponent(accession)}`,
    );
    await expect(this.page).toHaveURL(
      `/protein-structure?accession=${encodeURIComponent(accession)}`,
    );
  }
}
