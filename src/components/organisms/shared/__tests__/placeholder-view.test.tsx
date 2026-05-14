import { render, screen } from "@testing-library/react";

import { PlaceholderView } from "../placeholder-view";

describe("PlaceholderView", () => {
  it("renders the title", () => {
    render(<PlaceholderView title="Taxonomy" />);

    expect(screen.getByText("Taxonomy")).toBeInTheDocument();
  });

  it("renders the default description when none is supplied", () => {
    render(<PlaceholderView title="Genomes" />);

    expect(screen.getByText("This view is coming soon.")).toBeInTheDocument();
  });

  it("renders a custom description when supplied", () => {
    render(
      <PlaceholderView
        title="Features"
        description="Feature browsing is planned for a future release."
      />,
    );

    expect(
      screen.getByText("Feature browsing is planned for a future release."),
    ).toBeInTheDocument();
  });
});
