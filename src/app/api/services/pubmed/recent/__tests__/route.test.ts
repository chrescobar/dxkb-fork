import { http, HttpResponse } from "msw";

import { GET } from "../route";
import { mockNextRequest } from "@/test-helpers/api-route-helpers";
import { server } from "@/test-helpers/msw-server";

const baseUrl = "https://eutils.test/entrez/eutils";

beforeEach(() => {
  process.env.PUBMED_EUTILS_BASE_URL = baseUrl;
});

afterEach(() => {
  delete process.env.PUBMED_EUTILS_BASE_URL;
});

describe("GET /api/services/pubmed/recent", () => {
  it("validates term", async () => {
    const response = await GET(
      mockNextRequest({ url: "http://localhost:3019/api/services/pubmed/recent" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing required query parameter: term",
    });
  });

  it("returns shaped articles", async () => {
    server.use(
      http.get(`${baseUrl}/esearch.fcgi`, () =>
        HttpResponse.json({ esearchresult: { idlist: ["1"] } }),
      ),
      http.get(`${baseUrl}/esummary.fcgi`, () =>
        HttpResponse.json({
          result: {
            uids: ["1"],
            "1": {
              title: "Bacteria article",
              source: "J Bacteriol",
              sortpubdate: "2026/04/01 00:00",
              authors: [{ name: "Smith J" }, { name: "Patel R" }],
            },
          },
        }),
      ),
    );

    const response = await GET(
      mockNextRequest({
        url: "http://localhost:3019/api/services/pubmed/recent",
        searchParams: { term: "Bacteria", limit: "50" },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
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
    });
  });

  it("returns 502 with the original NCBI message on upstream failure", async () => {
    server.use(
      http.get(`${baseUrl}/esearch.fcgi`, () =>
        HttpResponse.text("NCBI unavailable", { status: 503 }),
      ),
    );

    const response = await GET(
      mockNextRequest({
        url: "http://localhost:3019/api/services/pubmed/recent",
        searchParams: { term: "Bacteria" },
      }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "NCBI unavailable" });
  });
});
