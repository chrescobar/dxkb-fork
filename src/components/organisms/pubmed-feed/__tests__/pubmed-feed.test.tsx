import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { vi } from "vitest";

vi.mock("@/lib/services/organisms/pubmed", () => ({
  fetchRecentPubMedArticles: vi.fn(),
}));

import { fetchRecentPubMedArticles } from "@/lib/services/organisms/pubmed";
import { PubMedFeed } from "../pubmed-feed";

async function renderServer(node: Promise<React.ReactElement>) {
  const resolved = await node;
  return render(<Suspense fallback={null}>{resolved}</Suspense>);
}

describe("PubMedFeed", () => {
  it("renders articles from the pubmed lib", async () => {
    vi.mocked(fetchRecentPubMedArticles).mockResolvedValueOnce([
      {
        pmid: "1",
        title: "Bacteria article",
        authors: ["Smith J et al"],
        journal: "J Bacteriol",
        date: "2026-04-01",
        url: "https://pubmed.ncbi.nlm.nih.gov/1/",
      },
    ]);

    await renderServer(PubMedFeed({ term: "Bacteria", limit: 5 }));

    expect(screen.getByText("Recent PubMed")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Bacteria article" }),
    ).toHaveAttribute("href", "https://pubmed.ncbi.nlm.nih.gov/1/");
    expect(screen.getByText("J Bacteriol • Smith J et al")).toBeInTheDocument();
  });

  it("renders empty state when no articles are returned", async () => {
    vi.mocked(fetchRecentPubMedArticles).mockResolvedValueOnce([]);

    await renderServer(PubMedFeed({ term: "Bacteria", limit: 5 }));

    expect(
      screen.getByText("No recent articles were returned."),
    ).toBeInTheDocument();
  });
});
