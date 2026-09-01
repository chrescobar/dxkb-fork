import { Suspense } from "react";
import { parseEpitopeCollectionState } from "@/lib/epitope-view";
import type { SearchParamsRecord } from "@/lib/views/rql";
import { EpitopeCollection } from "./epitope-collection";
import EpitopeLoading from "./loading";

interface EpitopeCollectionPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export default async function EpitopeCollectionPage({
  searchParams,
}: EpitopeCollectionPageProps) {
  const state = parseEpitopeCollectionState(await searchParams);
  return (
    <Suspense fallback={<EpitopeLoading />}>
      <EpitopeCollection initialState={state} />
    </Suspense>
  );
}
