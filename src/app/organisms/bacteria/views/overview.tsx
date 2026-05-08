import { Suspense } from "react";

import { DataSummary } from "@/components/organisms/data-summary/data-summary";
import { DataSummarySkeleton } from "@/components/organisms/data-summary/data-summary-skeleton";
import { ExternalTools } from "@/components/organisms/external-tools/external-tools";
import { FeaturedGeneraGrid } from "@/components/organisms/genera-grid/featured-genera-grid";
import { GeneraGrid } from "@/components/organisms/genera-grid/genera-grid";
import { GeneraGridSkeleton } from "@/components/organisms/genera-grid/genera-grid-skeleton";
import { MetadataDistributions } from "@/components/organisms/metadata-distributions/metadata-distributions";
import { MetadataDistributionsSkeleton } from "@/components/organisms/metadata-distributions/metadata-distributions-skeleton";
import { PubMedFeed } from "@/components/organisms/pubmed-feed/pubmed-feed";
import { PubMedFeedSkeleton } from "@/components/organisms/pubmed-feed/pubmed-feed-skeleton";
import { SectionError } from "@/components/organisms/shared/section-error";

import { bacteriaLandingConfig as config } from "../_config";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function DataSummaryBoundary() {
  try {
    return await DataSummary({ taxonId: config.taxonId });
  } catch (error) {
    return <SectionError message={errorMessage(error)} />;
  }
}

async function GeneraGridBoundary() {
  try {
    return await GeneraGrid({ taxonId: config.taxonId, limit: 12 });
  } catch (error) {
    return <SectionError message={errorMessage(error)} />;
  }
}

async function MetadataDistributionsBoundary() {
  try {
    return await MetadataDistributions({
      taxonId: config.taxonId,
      fields: config.metadataFields,
    });
  } catch (error) {
    return <SectionError message={errorMessage(error)} />;
  }
}

async function PubMedFeedBoundary() {
  try {
    return await PubMedFeed({ term: config.pubmedTerm, limit: 4 });
  } catch (error) {
    return <SectionError message={errorMessage(error)} />;
  }
}

export function OverviewView() {
  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<DataSummarySkeleton />}>
        <DataSummaryBoundary />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-8">
          <FeaturedGeneraGrid />

          <Suspense fallback={<GeneraGridSkeleton />}>
            <GeneraGridBoundary />
          </Suspense>

          <Suspense fallback={<MetadataDistributionsSkeleton />}>
            <MetadataDistributionsBoundary />
          </Suspense>
        </div>

        <aside className="flex min-w-0 flex-col gap-8">
          <Suspense fallback={<PubMedFeedSkeleton />}>
            <PubMedFeedBoundary />
          </Suspense>
          <ExternalTools resources={config.externalTools} />
        </aside>
      </div>
    </div>
  );
}
