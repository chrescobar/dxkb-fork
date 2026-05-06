import type { OrganismFetchOptions, OrganismPubMedArticle } from "./types";
import {
  organismFetchCacheInit,
  organismPubMedRevalidateSeconds,
  readJsonObject,
  responseErrorMessage,
} from "./utils";

interface PubMedSearchResult {
  esearchresult?: {
    idlist?: unknown;
  };
}

interface PubMedAuthor {
  name?: unknown;
}

interface PubMedSummaryEntry {
  uid?: unknown;
  title?: unknown;
  authors?: unknown;
  source?: unknown;
  sortpubdate?: unknown;
  pubdate?: unknown;
}

function getEutilsBaseUrl(): string {
  return (process.env.PUBMED_EUTILS_BASE_URL ?? "https://eutils.ncbi.nlm.nih.gov/entrez/eutils").replace(/\/+$/, "");
}

function appendNcbiApiKey(url: URL): void {
  const apiKey = process.env.NCBI_API_KEY;
  if (apiKey) url.searchParams.set("api_key", apiKey);
}

function idListFromSearch(payload: PubMedSearchResult): string[] {
  const idlist = payload.esearchresult?.idlist;
  if (!Array.isArray(idlist)) return [];
  return idlist.filter((id): id is string => typeof id === "string" && id.length > 0);
}

function condensedAuthors(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const names = value
    .map((author: PubMedAuthor) => author.name)
    .filter((name): name is string => typeof name === "string" && name.length > 0);
  if (names.length <= 1) return names;
  return [`${names[0]} et al`];
}

function normalizePubMedDate(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) return "";
  const match = value.match(/^(\d{4})(?:[/-](\d{1,2}))?(?:[/-](\d{1,2}))?/);
  if (!match) return value;
  const [, year, month = "01", day = "01"] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

async function fetchJson(url: URL, signal: AbortSignal | undefined): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method: "GET",
    signal,
    ...organismFetchCacheInit(organismPubMedRevalidateSeconds),
  });

  if (!response.ok) {
    throw new Error(await responseErrorMessage(response));
  }

  return readJsonObject(response, url.pathname);
}

export async function fetchRecentPubMedArticles(
  term: string,
  limit = 5,
  options: OrganismFetchOptions = {},
): Promise<OrganismPubMedArticle[]> {
  const boundedLimit = Math.max(0, Math.min(limit, 20));
  if (!term || boundedLimit === 0) return [];

  const baseUrl = getEutilsBaseUrl();
  const searchUrl = new URL(`${baseUrl}/esearch.fcgi`);
  searchUrl.searchParams.set("db", "pubmed");
  searchUrl.searchParams.set("retmode", "json");
  searchUrl.searchParams.set("term", term);
  searchUrl.searchParams.set("retmax", String(boundedLimit));
  searchUrl.searchParams.set("sort", "pub date");
  searchUrl.searchParams.set("usehistory", "y");
  appendNcbiApiKey(searchUrl);

  const searchPayload = (await fetchJson(searchUrl, options.signal)) as PubMedSearchResult;
  const ids = idListFromSearch(searchPayload);
  if (ids.length === 0) return [];

  const summaryUrl = new URL(`${baseUrl}/esummary.fcgi`);
  summaryUrl.searchParams.set("db", "pubmed");
  summaryUrl.searchParams.set("retmode", "json");
  summaryUrl.searchParams.set("id", ids.join(","));
  appendNcbiApiKey(summaryUrl);

  const summaryPayload = await fetchJson(summaryUrl, options.signal);
  const result = summaryPayload.result;
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("Unexpected PubMed esummary response shape");
  }

  const resultMap = result as Record<string, unknown>;
  return ids
    .map((pmid) => {
      const entry = resultMap[pmid] as PubMedSummaryEntry | undefined;
      if (!entry || typeof entry !== "object") return null;
      return {
        pmid,
        title: typeof entry.title === "string" ? entry.title : "Untitled PubMed article",
        authors: condensedAuthors(entry.authors),
        journal: typeof entry.source === "string" ? entry.source : "",
        date: normalizePubMedDate(entry.sortpubdate ?? entry.pubdate),
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      };
    })
    .filter((article): article is OrganismPubMedArticle => article !== null);
}
