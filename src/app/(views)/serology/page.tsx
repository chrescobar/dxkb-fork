import { Suspense } from "react";
import { parseSerologyCollectionState } from "@/lib/serology-view";
import type { SearchParamsRecord } from "@/lib/views/rql";
import SerologyLoading from "./loading";
import { SerologyCollection } from "./serology-collection";

export const metadata = {
  title: "Serology",
  description: "Browse public serology sample records.",
};

interface SerologyCollectionPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export default async function SerologyCollectionPage({
  searchParams,
}: SerologyCollectionPageProps) {
  const state = parseSerologyCollectionState(await searchParams);

  return (
    <Suspense fallback={<SerologyLoading />}>
      <SerologyCollection initialState={state} />
    </Suspense>
  );
}
