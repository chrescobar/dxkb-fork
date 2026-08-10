import { type NextRequest, NextResponse } from "next/server";

import {
  availableDatasetIds,
  remoteDatasetExists,
} from "@/lib/phylogeny/dataset-store";
import { canonicalDatasetId } from "@/lib/phylogeny/nextstrain-dataset";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const localIds = await availableDatasetIds();
    const requestedIds = request.nextUrl.searchParams.getAll("id");
    const ids = new Set(localIds);

    await Promise.all(
      requestedIds.map(async (value) => {
        const id = canonicalDatasetId(value);
        if (id && !localIds.has(id) && (await remoteDatasetExists(id)))
          ids.add(id);
      }),
    );

    return NextResponse.json({ ids: [...ids].sort() });
  } catch (error) {
    console.error("nextstrain inventory unavailable", error);
    return NextResponse.json(
      { error: "dataset store unavailable" },
      { status: 500 },
    );
  }
}
