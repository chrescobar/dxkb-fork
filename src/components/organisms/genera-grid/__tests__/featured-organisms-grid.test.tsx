import { render, screen } from "@testing-library/react";

import { FeaturedOrganismsGrid } from "../featured-organisms-grid";

const data = [
  { name: "SARS-CoV-2", href: "/taxonomy/2697049" },
  { name: "Influenza A virus", href: "/taxonomy/2955291" },
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
