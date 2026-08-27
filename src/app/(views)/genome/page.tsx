import { Suspense } from "react";
import { GenomeCollection } from "./genome-collection";
import GenomeLoading from "./loading";
import {
  genomeCollectionOptions,
  parseGenomeCollectionState,
} from "@/lib/genome-view";
import { serializeCollectionState } from "@/lib/views/collection-state";
import type { SearchParamsRecord } from "@/lib/views/rql";

interface GenomeCollectionPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export default async function GenomeCollectionPage({
  searchParams,
}: GenomeCollectionPageProps) {
  const state = parseGenomeCollectionState(await searchParams);
  const stateKey = serializeCollectionState(
    state,
    genomeCollectionOptions,
  ).toString();
  return (
    <Suspense fallback={<GenomeLoading />}>
      <GenomeCollection key={stateKey} initialState={state} />
    </Suspense>
  );
}
