import { render, screen } from "@testing-library/react";

import { GeneraCard } from "../genera-card";

describe("GeneraCard", () => {
  it("renders a deterministic avatar, genome count, and legacy link", () => {
    const href =
      "https://www.bv-brc.org/view/Taxonomy/2#view_tab=genomes&filter=genus:Escherichia";
    render(<GeneraCard name="Escherichia" count={128450} href={href} />);

    expect(screen.getByText("Escherichia")).toBeInTheDocument();
    expect(screen.getByText("128,450 genomes")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View Escherichia genomes" }),
    ).toHaveAttribute(
      "href",
      expect.stringContaining("https://www.bv-brc.org/view/Taxonomy/2"),
    );
  });

  it("renders blank genus labels as Unspecified without changing the legacy filter value", () => {
    const href =
      "https://www.bv-brc.org/view/Taxonomy/2#view_tab=genomes&filter=genus:";
    render(<GeneraCard name="" count={18550} href={href} />);

    expect(screen.getByText("Unspecified")).toBeInTheDocument();
    expect(screen.getByText("18,550 genomes")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View Unspecified genomes" }),
    ).toHaveAttribute("href", expect.stringContaining("filter=genus:"));
  });

  it("renders without count as a featured card (no genome count line)", () => {
    const href = "https://www.bv-brc.org/view/Taxonomy/561#view_tab=overview";
    render(<GeneraCard name="Escherichia" href={href} />);

    expect(screen.getByText("Escherichia")).toBeInTheDocument();
    expect(screen.queryByText(/genomes/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View Escherichia overview" }),
    ).toHaveAttribute("href", expect.stringContaining("#view_tab=overview"));
  });
});
