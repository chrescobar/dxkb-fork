import { http, HttpResponse } from "msw";

import { fetchRecentPubMedArticles } from "@/lib/services/organisms/pubmed";
import { server } from "@/test-helpers/msw-server";

const baseUrl = "https://eutils.test/entrez/eutils";

beforeEach(() => {
  process.env.PUBMED_EUTILS_BASE_URL = baseUrl;
});

afterEach(() => {
  delete process.env.PUBMED_EUTILS_BASE_URL;
  delete process.env.NCBI_API_KEY;
});

describe("fetchRecentPubMedArticles", () => {
  it("chains esearch and esummary into shaped articles", async () => {
    const capturedUrls: string[] = [];
    server.use(
      http.get(`${baseUrl}/esearch.fcgi`, ({ request }) => {
        capturedUrls.push(request.url);
        return HttpResponse.json({ esearchresult: { idlist: ["1", "2"] } });
      }),
      http.get(`${baseUrl}/esummary.fcgi`, ({ request }) => {
        capturedUrls.push(request.url);
        return HttpResponse.json({
          result: {
            uids: ["1", "2"],
            "1": {
              title: "First bacteria article",
              source: "J Bacteriol",
              sortpubdate: "2026/04/01 00:00",
              authors: [{ name: "Smith J" }, { name: "Patel R" }],
            },
            "2": {
              title: "Second bacteria article",
              source: "Microbiology",
              sortpubdate: "2026/03/01 00:00",
              authors: [{ name: "Chen L" }],
            },
          },
        });
      }),
    );

    await expect(fetchRecentPubMedArticles("Bacteria", 2)).resolves.toEqual([
      {
        pmid: "1",
        title: "First bacteria article",
        authors: ["Smith J et al"],
        journal: "J Bacteriol",
        date: "2026-04-01",
        url: "https://pubmed.ncbi.nlm.nih.gov/1/",
      },
      {
        pmid: "2",
        title: "Second bacteria article",
        authors: ["Chen L"],
        journal: "Microbiology",
        date: "2026-03-01",
        url: "https://pubmed.ncbi.nlm.nih.gov/2/",
      },
    ]);
    expect(capturedUrls[0]).toContain("term=Bacteria");
    expect(capturedUrls[0]).toContain("usehistory=y");
    expect(capturedUrls[1]).toContain("id=1%2C2");
  });

  it("returns an empty list when esearch has no ids", async () => {
    server.use(
      http.get(`${baseUrl}/esearch.fcgi`, () =>
        HttpResponse.json({ esearchresult: { idlist: [] } }),
      ),
    );

    await expect(fetchRecentPubMedArticles("Bacteria", 5)).resolves.toEqual([]);
  });

  it("preserves upstream error text", async () => {
    server.use(
      http.get(`${baseUrl}/esearch.fcgi`, () =>
        HttpResponse.text("NCBI rate limit", { status: 429 }),
      ),
    );

    await expect(fetchRecentPubMedArticles("Bacteria", 5)).rejects.toThrow("NCBI rate limit");
  });
});
