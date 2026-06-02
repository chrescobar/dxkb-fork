import { render, screen } from "@testing-library/react";

import { FeaturedOrganismCategoriesGrid } from "../featured-organism-categories-grid";

const categories = [
  {
    title: "The Three Domains",
    organisms: [
      { name: "Bacteria", href: "https://www.bv-brc.org/view/Taxonomy/2#view_tab=overview" },
      { name: "Archaea", href: "https://www.bv-brc.org/view/Taxonomy/2157#view_tab=overview" },
    ],
  },
  {
    title: "Animals",
    organisms: [
      { name: "Mammalia", href: "https://www.bv-brc.org/view/Taxonomy/40674#view_tab=overview" },
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
