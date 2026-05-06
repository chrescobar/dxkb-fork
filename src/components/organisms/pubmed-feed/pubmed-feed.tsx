import { headers } from "next/headers";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OrganismPubMedArticle } from "@/lib/services/organisms/types";
import {
  organismFetchCacheInit,
  organismPubMedRevalidateSeconds,
} from "@/lib/services/organisms/utils";

interface PubMedFeedProps {
  term: string;
  limit?: number;
}

async function internalOrigin(): Promise<string> {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get("host") ?? "localhost:3019";
    const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${protocol}://${host}`;
  } catch {
    return "http://localhost:3019";
  }
}

async function responseMessage(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  if (!text.trim()) return `${response.status} ${response.statusText}`.trim();
  try {
    const parsed = JSON.parse(text) as { error?: unknown };
    return typeof parsed.error === "string" ? parsed.error : text;
  } catch {
    return text;
  }
}

async function fetchArticles(term: string, limit: number): Promise<OrganismPubMedArticle[]> {
  const url = new URL("/api/services/pubmed/recent", await internalOrigin());
  url.searchParams.set("term", term);
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    ...organismFetchCacheInit(organismPubMedRevalidateSeconds),
  });

  if (!response.ok) {
    throw new Error(await responseMessage(response));
  }

  const payload = (await response.json()) as { articles?: unknown };
  if (!Array.isArray(payload.articles)) {
    throw new Error("Unexpected PubMed proxy response shape");
  }
  return payload.articles as OrganismPubMedArticle[];
}

export async function PubMedFeed({ term, limit = 5 }: PubMedFeedProps) {
  const articles = await fetchArticles(term, limit);

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>Recent PubMed</CardTitle>
        <CardDescription>Latest articles for {term}.</CardDescription>
      </CardHeader>
      <CardContent>
        {articles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent articles were returned.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {articles.map((article) => (
              <li key={article.pmid} className="border-b pb-4 last:border-b-0 last:pb-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {[article.date, article.journal].filter(Boolean).join(" / ")}
                </p>
                <Link
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-sm font-medium leading-5 text-primary hover:underline"
                >
                  {article.title}
                </Link>
                {article.authors.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {article.authors.join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
