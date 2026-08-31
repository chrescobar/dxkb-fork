import { Suspense } from "react";
import {
  parseSurveillanceCollectionState,
  surveillanceCollectionOptions,
} from "@/lib/surveillance-view";
import { serializeCollectionState } from "@/lib/views/collection-state";
import type { SearchParamsRecord } from "@/lib/views/rql";
import SurveillanceLoading from "./loading";
import { SurveillanceCollection } from "./surveillance-collection";

export const metadata = {
  title: "Surveillance",
  description: "Browse public pathogen surveillance sample records.",
};

export default async function SurveillanceCollectionPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>;
}) {
  const state = parseSurveillanceCollectionState(await searchParams);
  const stateKey = serializeCollectionState(
    state,
    surveillanceCollectionOptions,
  ).toString();

  return (
    <Suspense fallback={<SurveillanceLoading />}>
      <SurveillanceCollection key={stateKey} initialState={state} />
    </Suspense>
  );
}
