import { ArrowRight, BookOpen } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";

import { Card } from "@/components/ui/card";
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
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-normal">Recent PubMed</h2>
        <p className="text-muted-foreground text-sm">Latest articles for {term}.</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-2">
        {articles.length === 0 ? (
          <p className="text-muted-foreground text-xs">No recent articles were returned.</p>
        ) : (
          articles.map((article) => {
            const displayAuthors = article.authors.slice(0, 2).join(", ") + (article.authors.length > 2 ? " et al" : "");
            const displayInfo = [article.date, article.journal, displayAuthors].filter(Boolean).join(" • ");
            return (
              <Card key={article.pmid} className="gap-0 rounded-md py-0 shadow-none">
                <Link
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-muted/40 flex min-h-12 items-center gap-2.5 px-2.5 py-1.5 transition-colors"
                >
                  <div className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                    <BookOpen size={14} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h3
                      className="truncate text-sm leading-tight font-semibold"
                      title={article.title}
                    >
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground truncate text-[11px] leading-tight" title={displayInfo}>
                      {displayInfo}
                    </p>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-muted-foreground/50 shrink-0"
                    aria-hidden="true"
                  />
                </Link>
              </Card>
            );
          })
        )}
      </div>
    </section>
  );
}
