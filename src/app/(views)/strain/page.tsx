import { Suspense } from "react";
import { parseStrainCollectionState } from "@/lib/strain-view";
import type { SearchParamsRecord } from "@/lib/views/rql";
import StrainLoading from "./loading";
import { StrainCollection } from "./strain-collection";

export const metadata = {
  title: "Strains",
  description: "Browse segmented-virus strain records.",
};

interface StrainCollectionPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export default async function StrainCollectionPage({
  searchParams,
}: StrainCollectionPageProps) {
  const state = parseStrainCollectionState(await searchParams);

  return (
    <Suspense fallback={<StrainLoading />}>
      <StrainCollection initialState={state} />
    </Suspense>
  );
}
