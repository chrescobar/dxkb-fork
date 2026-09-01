import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
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

  it("remounts for a new query but not for pagination or sorting", async () => {
    const collectionKey = async (params: Record<string, string>) => {
      const page = (await GenomeCollectionPage({
        searchParams: Promise.resolve(params),
      })) as ReactElement<{ children: ReactElement }>;
      return page.props.children.key;
    };

    const initialKey = await collectionKey({ taxon_id: "561" });

    expect(await collectionKey({ taxon_id: "561", page: "2" })).toBe(
      initialKey,
    );
    expect(
      await collectionKey({
        taxon_id: "561",
        sort: "genome_length:desc",
      }),
    ).toBe(initialKey);
    expect(await collectionKey({ taxon_id: "562" })).not.toBe(initialKey);
  });
});
