import { render, screen } from "@testing-library/react";

import VirusesPage from "../page";

describe("VirusesPage", () => {
  it("renders the selected stub view through the shared shell", async () => {
    const node = await VirusesPage({
      searchParams: Promise.resolve({ tab: "taxonomy" }),
    });

    render(node);

    expect(
      screen.getByRole("heading", { level: 1, name: "Viruses" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This view is coming soon/),
    ).toBeInTheDocument();
  });

  it("renders legacy placeholder tabs through URL state", async () => {
    const node = await VirusesPage({
      searchParams: Promise.resolve({ tab: "features" }),
    });

    render(node);

    expect(screen.getAllByText("Features")).toHaveLength(2);
    expect(
      screen.getByText(/This view is coming soon/),
    ).toBeInTheDocument();
  });
});
