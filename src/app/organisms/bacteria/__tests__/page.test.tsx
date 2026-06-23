import { render, screen } from "@testing-library/react";

import BacteriaPage from "../page";

describe("BacteriaPage", () => {
  it("renders the selected stub view through the shared shell", async () => {
    const node = await BacteriaPage({
      searchParams: Promise.resolve({ tab: "taxonomy" }),
    });

    render(node);

    expect(
      screen.getByRole("heading", { level: 1, name: "Bacteria" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Taxonomy browsing is stubbed/),
    ).toBeInTheDocument();
  });

  it("renders legacy placeholder tabs through URL state", async () => {
    const node = await BacteriaPage({
      searchParams: Promise.resolve({ tab: "amr-phenotypes" }),
    });

    render(node);

    // Active label appears 3×: desktop nav button, mobile pill, placeholder heading.
    expect(screen.getAllByText("AMR Phenotypes")).toHaveLength(3);
    expect(
      screen.getByText(/This view is coming soon/),
    ).toBeInTheDocument();
  });
});
