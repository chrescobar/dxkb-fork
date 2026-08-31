import { Suspense } from "react";
import {
  featureCollectionOptions,
  parseFeatureCollectionState,
} from "@/lib/feature-view";
import { serializeCollectionState } from "@/lib/views/collection-state";
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
  const stateKey = serializeCollectionState(
    state,
    featureCollectionOptions,
  ).toString();
  return (
    <Suspense fallback={<FeatureLoading />}>
      <FeatureCollection key={stateKey} initialState={state} />
    </Suspense>
  );
}
