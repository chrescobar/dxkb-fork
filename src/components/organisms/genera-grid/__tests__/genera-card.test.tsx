import { render, screen } from "@testing-library/react";

import { GeneraCard } from "../genera-card";

describe("GeneraCard", () => {
  it("renders a deterministic avatar, genome count, and legacy link", () => {
    render(<GeneraCard name="Escherichia" count={128450} taxonId={2} />);

    expect(screen.getByText("Escherichia")).toBeInTheDocument();
    expect(screen.getByText("128,450 genomes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View/ })).toHaveAttribute(
      "href",
      expect.stringContaining("https://www.bv-brc.org/view/Taxonomy/2"),
    );
  });

  it("renders blank genus labels as Unspecified without changing the legacy filter value", () => {
    render(<GeneraCard name="" count={18550} taxonId={2} />);

    expect(screen.getByText("Unspecified")).toBeInTheDocument();
    expect(screen.getByText("18,550 genomes")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View Unspecified genomes" }),
    ).toHaveAttribute("href", expect.stringContaining("filter=genus:"));
  });
});
