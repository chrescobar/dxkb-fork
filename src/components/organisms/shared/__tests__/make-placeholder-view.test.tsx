import { render, screen } from "@testing-library/react";

import { makePlaceholderView } from "../make-placeholder-view";

describe("makePlaceholderView", () => {
  it("returns a component that renders PlaceholderView with the given title", () => {
    const View = makePlaceholderView("Protein Structures");
    render(<View />);

    expect(screen.getByText("Protein Structures")).toBeInTheDocument();
    expect(screen.getByText("This view is coming soon.")).toBeInTheDocument();
  });

  it("sets the displayName to <TitleNoSpaces>View", () => {
    const View = makePlaceholderView("Protein Structures");

    expect(View.displayName).toBe("ProteinStructuresView");
  });

  it("passes a custom description through to the rendered card", () => {
    const View = makePlaceholderView("Taxonomy", "Taxonomy is coming soon.");
    render(<View />);

    expect(screen.getByText("Taxonomy is coming soon.")).toBeInTheDocument();
  });
});
