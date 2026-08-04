import { type NextRequest, NextResponse } from "next/server";

import {
  readDataset,
  SIDECARS,
  type Sidecar,
} from "@/lib/phylogeny/dataset-store";
import {
  canonicalDatasetId,
  stripViewerPrefix,
} from "@/lib/phylogeny/nextstrain-dataset";

export const runtime = "nodejs";

function isSidecar(value: string): value is Sidecar {
  return (SIDECARS as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  const prefix = request.nextUrl.searchParams.get("prefix");
  if (!prefix) {
    return NextResponse.json({ error: "prefix is required" }, { status: 400 });
  }

  const type = request.nextUrl.searchParams.get("type");
  const sidecar = type === null || type === "tree" ? undefined : type;
  if (sidecar !== undefined && !isSidecar(sidecar)) {
    return NextResponse.json({ error: "unsupported dataset type" }, { status: 400 });
  }

  const datasetId = canonicalDatasetId(stripViewerPrefix(prefix));
  if (!datasetId) {
    return NextResponse.json({ error: "invalid dataset identifier" }, { status: 400 });
  }

  try {
    const body = await readDataset(datasetId, sidecar);
    if (body === null) {
      return NextResponse.json({ error: "dataset not found" }, { status: 404 });
    }

    return new NextResponse(body, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(`charon/getDataset: store unavailable for '${datasetId}'`, error);
    return NextResponse.json(
      { error: "dataset store unavailable" },
      { status: 500 },
    );
  }
}
