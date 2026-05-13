import { Suspense } from "react";

import { DataSummary } from "@/components/organisms/data-summary/data-summary";
import { DataSummarySkeleton } from "@/components/organisms/data-summary/data-summary-skeleton";
import { featuredViruses } from "@/components/organisms/genera-grid/featured-viruses-data";
import { FeaturedOrganismsGrid } from "@/components/organisms/genera-grid/featured-organisms-grid";
import { MetadataDistributions } from "@/components/organisms/metadata-distributions/metadata-distributions";
import { MetadataDistributionsSkeleton } from "@/components/organisms/metadata-distributions/metadata-distributions-skeleton";
import { SectionError } from "@/components/organisms/shared/section-error";
import { VirusFamiliesSection } from "@/components/organisms/virus-families/virus-families-section";

import { virusesLandingConfig as config } from "../_config";

async function withSectionError(
  load: () => Promise<React.ReactElement>,
): Promise<React.ReactElement> {
  try {
    return await load();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return <SectionError message={message} />;
  }
}

async function DataSummaryBoundary() {
  return withSectionError(() => DataSummary({ taxonId: config.taxonId }));
}

async function MetadataDistributionsBoundary() {
  return withSectionError(() =>
    MetadataDistributions({
      taxonId: config.taxonId,
      fields: config.metadataFields,
    }),
  );
}

export function OverviewView() {
  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<DataSummarySkeleton />}>
        <DataSummaryBoundary />
      </Suspense>

      <div className="flex min-w-0 flex-col gap-8">
        <VirusFamiliesSection />

        <FeaturedOrganismsGrid
          data={featuredViruses}
          title="Featured Viruses"
          subtitle="Curated viruses and virus groups of biodefense and infectious disease relevance."
        />

        <Suspense fallback={<MetadataDistributionsSkeleton />}>
          <MetadataDistributionsBoundary />
        </Suspense>
      </div>
    </div>
  );
}
