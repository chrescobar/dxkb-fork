import { NextResponse } from "next/server";

import { getCuratedLists } from "@/lib/taxon-view/curated-lists";

// REQUIRED: this GET handler takes no args and reads no cookies()/headers(), so
// Next 16 would statically evaluate it at build time — freezing the response to
// the build-time value of TAXON_VIEW_POLICY_JSON. force-dynamic makes it
// re-read the env var per request, which is the whole point of the override.
export const dynamic = "force-dynamic";

export function GET() {
  const lists = getCuratedLists();
  return NextResponse.json({
    sfvtTaxonIds: [...lists.sfvtTaxonIds],
    surveillanceLineageNames: [...lists.surveillanceLineageNames],
    serologyLineageNames: [...lists.serologyLineageNames],
  });
}
