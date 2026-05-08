import { NextRequest, NextResponse } from "next/server";

import { fetchRecentPubMedArticles } from "@/lib/services/organisms/pubmed";

export const revalidate = 3600;

function parseLimit(value: string | null): number {
  if (value === null) return 5;
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 1) return 5;
  return Math.min(numeric, 20);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term")?.trim();
  const limit = parseLimit(searchParams.get("limit"));

  if (!term) {
    return NextResponse.json(
      { error: "Missing required query parameter: term" },
      { status: 400 },
    );
  }

  try {
    const articles = await fetchRecentPubMedArticles(term, limit);
    return NextResponse.json({ articles });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
