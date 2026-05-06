import { render, screen } from "@testing-library/react";

import BacteriaPage from "../page";

describe("BacteriaPage", () => {
  it("renders the selected stub view through the shared shell", async () => {
    const node = await BacteriaPage({
      searchParams: Promise.resolve({ view: "taxonomy" }),
    });

    render(node);

    expect(screen.getByRole("heading", { level: 1, name: "Bacteria" })).toBeInTheDocument();
    expect(screen.getByText(/Taxonomy browsing is stubbed/)).toBeInTheDocument();
  });
});
