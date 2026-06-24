import { render, screen } from "@testing-library/react";

import AllOrganismsPage from "../page";

describe("AllOrganismsPage", () => {
  it("renders the selected stub view through the shared shell", async () => {
    const node = await AllOrganismsPage({
      searchParams: Promise.resolve({ tab: "taxonomy" }),
    });

    render(node);

    expect(
      screen.getByRole("heading", { level: 1, name: "All Organisms" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This view is coming soon/),
    ).toBeInTheDocument();
  });

  it("renders legacy placeholder tabs through URL state", async () => {
    const node = await AllOrganismsPage({
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
