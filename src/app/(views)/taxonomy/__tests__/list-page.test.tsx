import { render, screen } from "@testing-library/react";
import TaxonomyListPage from "../page";

it("renders the taxonomy list placeholder with friendly rql", async () => {
  render(await TaxonomyListPage({ searchParams: Promise.resolve({ keyword: "brucella" }) }));
  expect(screen.getByText("keyword(brucella)")).toBeInTheDocument();
});
