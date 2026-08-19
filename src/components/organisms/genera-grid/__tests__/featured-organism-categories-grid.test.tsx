import { render, screen } from "@testing-library/react";

import { FeaturedOrganismCategoriesGrid } from "../featured-organism-categories-grid";

const categories = [
  {
    title: "The Three Domains",
    organisms: [
      { name: "Bacteria", href: "/taxonomy/2" },
      { name: "Archaea", href: "/taxonomy/2157" },
    ],
  },
  {
    title: "Animals",
    organisms: [
      { name: "Mammalia", href: "/taxonomy/40674" },
    ],
  },
];

describe("FeaturedOrganismCategoriesGrid", () => {
  it("renders the section title and subtitle", () => {
    render(
      <FeaturedOrganismCategoriesGrid
        categories={categories}
        title="Featured Organisms"
        subtitle="Curated organism groups."
      />,
    );

    expect(screen.getByRole("heading", { name: "Featured Organisms" })).toBeInTheDocument();
    expect(screen.getByText("Curated organism groups.")).toBeInTheDocument();
  });

  it("renders each category title as an h3", () => {
    render(<FeaturedOrganismCategoriesGrid categories={categories} />);

    expect(screen.getByRole("heading", { level: 3, name: "The Three Domains" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Animals" })).toBeInTheDocument();
  });

  it("renders organism links within their categories", () => {
    render(<FeaturedOrganismCategoriesGrid categories={categories} />);

    expect(screen.getByRole("link", { name: "View Bacteria overview" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Archaea overview" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Mammalia overview" })).toBeInTheDocument();
  });
});
