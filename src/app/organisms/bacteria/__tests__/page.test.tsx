import { render, screen } from "@testing-library/react";

import BacteriaPage from "../page";

describe("BacteriaPage", () => {
  it("renders the selected stub view through the shared shell", async () => {
    const node = await BacteriaPage({
      searchParams: Promise.resolve({ tab: "taxa-tree" }),
    });

    render(node);

    expect(
      screen.getByRole("heading", { level: 1, name: "Bacteria" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Taxa Tree browsing is stubbed/),
    ).toBeInTheDocument();
  });

  it("renders legacy placeholder tabs through URL state", async () => {
    const node = await BacteriaPage({
      searchParams: Promise.resolve({ tab: "sequences" }),
    });

    render(node);

    // Active label appears 3×: desktop nav button, mobile pill, placeholder heading.
    expect(screen.getAllByText("Sequences")).toHaveLength(3);
    expect(
      screen.getByText(/This view is coming soon/),
    ).toBeInTheDocument();
  });
});
