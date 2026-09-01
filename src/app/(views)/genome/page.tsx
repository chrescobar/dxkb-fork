import { Suspense } from "react";
import { GenomeCollection } from "./genome-collection";
import GenomeLoading from "./loading";
import { parseGenomeCollectionState } from "@/lib/genome-view";
import type { SearchParamsRecord } from "@/lib/views/rql";

interface GenomeCollectionPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export default async function GenomeCollectionPage({
  searchParams,
}: GenomeCollectionPageProps) {
  const state = parseGenomeCollectionState(await searchParams);
  const queryKey = JSON.stringify([state.keyword, state.rql, state.filters]);
  return (
    <Suspense fallback={<GenomeLoading />}>
      <GenomeCollection key={queryKey} initialState={state} />
    </Suspense>
  );
}
