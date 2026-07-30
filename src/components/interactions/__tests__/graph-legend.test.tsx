import { render, screen } from "@testing-library/react";

import { GraphLegend } from "../graph-legend";

describe("GraphLegend", () => {
  it("renders all five legend entries", () => {
    render(<GraphLegend />);

    for (const label of [
      "Microbial protein",
      "Host protein",
      "Selected",
      "Predicted interaction",
      "Experimentally verified",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("exposes the svg as a single labelled image to assistive tech", () => {
    render(<GraphLegend />);
    expect(screen.getByRole("img", { name: "Graph legend" })).toBeInTheDocument();
  });

  it("drives text off the theme foreground so labels stay legible in dark mode", () => {
    render(<GraphLegend />);
    // Guards the dark-mode fix: without [&_text]:fill-foreground the SVG text
    // defaults to black and vanishes on the dark canvas.
    expect(screen.getByRole("img", { name: "Graph legend" })).toHaveClass("[&_text]:fill-foreground");
  });
});
