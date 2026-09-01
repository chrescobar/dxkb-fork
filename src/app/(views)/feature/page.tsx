import { Suspense } from "react";
import { parseFeatureCollectionState } from "@/lib/feature-view";
import type { SearchParamsRecord } from "@/lib/views/rql";
import { FeatureCollection } from "./feature-collection";
import FeatureLoading from "./loading";

interface FeatureCollectionPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export default async function FeatureCollectionPage({
  searchParams,
}: FeatureCollectionPageProps) {
  const state = parseFeatureCollectionState(await searchParams);
  return (
    <Suspense fallback={<FeatureLoading />}>
      <FeatureCollection initialState={state} />
    </Suspense>
  );
}
