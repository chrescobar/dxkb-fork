import { Suspense } from "react";
import { parseProteinFeatureCollectionState } from "@/lib/protein-feature-view";
import type { SearchParamsRecord } from "@/lib/views/rql";
import { DomainsAndMotifsCollection } from "./domains-and-motifs-collection";
import DomainsAndMotifsLoading from "./loading";

export const metadata = {
  title: "Domains and Motifs",
  description: "Browse protein domains, motifs, and other protein features.",
};

interface DomainsAndMotifsPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export default async function DomainsAndMotifsPage({
  searchParams,
}: DomainsAndMotifsPageProps) {
  const state = parseProteinFeatureCollectionState(await searchParams);
  return (
    <Suspense fallback={<DomainsAndMotifsLoading />}>
      <DomainsAndMotifsCollection initialState={state} />
    </Suspense>
  );
}
