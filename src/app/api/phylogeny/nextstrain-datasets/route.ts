import { NextResponse } from "next/server";

import { availableDatasetIds } from "@/lib/phylogeny/dataset-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const ids = [...(await availableDatasetIds())].sort();
    return NextResponse.json({ ids });
  } catch (error) {
    console.error("nextstrain inventory unavailable", error);
    return NextResponse.json(
      { error: "dataset store unavailable" },
      { status: 500 },
    );
  }
}
