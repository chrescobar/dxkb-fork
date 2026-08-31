import { Suspense } from "react";
import { epitopeCollectionOptions, parseEpitopeCollectionState } from "@/lib/epitope-view";
import { serializeCollectionState } from "@/lib/views/collection-state";
import type { SearchParamsRecord } from "@/lib/views/rql";
import { EpitopeCollection } from "./epitope-collection";
import EpitopeLoading from "./loading";

export default async function EpitopeCollectionPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>;
}) {
  const state = parseEpitopeCollectionState(await searchParams);
  const stateKey = serializeCollectionState(state, epitopeCollectionOptions).toString();
  return (
    <Suspense fallback={<EpitopeLoading />}>
      <EpitopeCollection key={stateKey} initialState={state} />
    </Suspense>
  );
}
