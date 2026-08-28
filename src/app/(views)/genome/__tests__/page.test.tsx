import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../genome-collection", () => ({
  GenomeCollection: ({
    initialState,
  }: {
    initialState: {
      page: number;
      sort: string;
      filters: Record<string, string[]>;
    };
  }) => <div data-testid="state">{JSON.stringify(initialState)}</div>,
}));
import GenomeCollectionPage from "../page";

describe("Genome collection route", () => {
  it("parses canonical URL state in the server component", async () => {
    render(
      await GenomeCollectionPage({
        searchParams: Promise.resolve({
          keyword: "coli",
          taxon_id: "561",
          page: "2",
          sort: "genome_length:desc",
        }),
      }),
    );
    expect(screen.getByTestId("state")).toHaveTextContent('"keyword":"coli"');
    expect(screen.getByTestId("state")).toHaveTextContent('"taxon_id":["561"]');
    expect(screen.getByTestId("state")).toHaveTextContent('"page":2');
  });
});
