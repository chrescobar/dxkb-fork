import { Suspense } from "react";
import { parseSurveillanceCollectionState } from "@/lib/surveillance-view";
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

  return (
    <Suspense fallback={<SurveillanceLoading />}>
      <SurveillanceCollection initialState={state} />
    </Suspense>
  );
}
