import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Suspense } from "react";

import { PubMedFeed } from "../pubmed-feed";
import { server } from "@/test-helpers/msw-server";

async function renderServer(node: Promise<React.ReactElement>) {
  const resolved = await node;
  return render(<Suspense fallback={null}>{resolved}</Suspense>);
}

describe("PubMedFeed", () => {
  it("renders articles returned by the internal proxy", async () => {
    server.use(
      http.get("http://localhost:3019/api/services/pubmed/recent", () =>
        HttpResponse.json({
          articles: [
            {
              pmid: "1",
              title: "Bacteria article",
              authors: ["Smith J et al"],
              journal: "J Bacteriol",
              date: "2026-04-01",
              url: "https://pubmed.ncbi.nlm.nih.gov/1/",
            },
          ],
        }),
      ),
    );

    await renderServer(PubMedFeed({ term: "Bacteria", limit: 5 }));

    expect(screen.getByText("Recent PubMed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bacteria article" })).toHaveAttribute(
      "href",
      "https://pubmed.ncbi.nlm.nih.gov/1/",
    );
    expect(screen.getByText("Smith J et al")).toBeInTheDocument();
  });
});
