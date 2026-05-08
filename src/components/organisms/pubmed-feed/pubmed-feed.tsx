import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { fetchRecentPubMedArticles } from "@/lib/services/organisms/pubmed";

interface PubMedFeedProps {
  term: string;
  limit?: number;
}

export async function PubMedFeed({ term, limit = 5 }: PubMedFeedProps) {
  const articles = await fetchRecentPubMedArticles(term, limit);

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-normal">Recent PubMed</h2>
        <p className="text-muted-foreground text-sm">
          Latest articles for {term}.
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-2">
        {articles.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No recent articles were returned.
          </p>
        ) : (
          articles.map((article) => {
            const journalAndAuthors = [article.journal, article.authors[0]]
              .filter(Boolean)
              .join(" • ");
            return (
              <Card
                key={article.pmid}
                className="gap-0 rounded-md py-0 shadow-none"
              >
                <Link
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={article.title}
                  className="hover:bg-muted/40 flex h-36 items-start gap-3 overflow-hidden px-3 py-3 transition-colors"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3
                      className="line-clamp-3 text-sm leading-tight font-semibold"
                      title={article.title}
                    >
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground line-clamp-2 text-xs leading-tight">
                      {journalAndAuthors}
                    </p>
                    {article.date && (
                      <p className="text-muted-foreground/70 text-xs">
                        {article.date}
                      </p>
                    )}
                  </div>
                  <ExternalLink
                    size={14}
                    className="text-muted-foreground/50 mt-0.5 shrink-0"
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
