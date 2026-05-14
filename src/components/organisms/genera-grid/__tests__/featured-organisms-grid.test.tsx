import { render, screen } from "@testing-library/react";

import { FeaturedOrganismsGrid } from "../featured-organisms-grid";

const data = [
  { name: "SARS-CoV-2", href: "https://www.bv-brc.org/view/Taxonomy/2697049#view_tab=overview" },
  { name: "Influenza A virus", href: "https://www.bv-brc.org/view/Taxonomy/197911#view_tab=overview" },
];

describe("FeaturedOrganismsGrid", () => {
  it("renders the title and subtitle", () => {
    render(
      <FeaturedOrganismsGrid
        data={data}
        title="Featured Viruses"
        subtitle="Curated viruses of biodefense relevance."
      />,
    );

    expect(screen.getByRole("heading", { name: "Featured Viruses" })).toBeInTheDocument();
    expect(screen.getByText("Curated viruses of biodefense relevance.")).toBeInTheDocument();
  });

  it("renders one accessible link per item in data", () => {
    render(<FeaturedOrganismsGrid data={data} title="Featured Viruses" />);

    expect(
      screen.getByRole("link", { name: "View SARS-CoV-2 overview" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View Influenza A virus overview" }),
    ).toBeInTheDocument();
  });

  it("renders an empty grid when data is empty", () => {
    render(<FeaturedOrganismsGrid data={[]} title="Featured Viruses" />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
