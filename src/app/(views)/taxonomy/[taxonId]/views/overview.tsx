import { Suspense } from "react";

import { GeoDistribution } from "@/components/organisms/geo-distribution/geo-distribution";
import { GeoDistributionSkeleton } from "@/components/organisms/geo-distribution/geo-distribution-skeleton";
import { MetadataDistributions } from "@/components/organisms/metadata-distributions/metadata-distributions";
import { MetadataDistributionsSkeleton } from "@/components/organisms/metadata-distributions/metadata-distributions-skeleton";
import { ReferenceGenomes } from "@/components/organisms/reference-genomes/reference-genomes";
import { ReferenceGenomesSkeleton } from "@/components/organisms/reference-genomes/reference-genomes-skeleton";
import { withSectionError } from "@/components/organisms/shared/with-section-error";
import { TaxonomySummary } from "@/components/organisms/taxonomy-summary/taxonomy-summary";
import { TaxonomySummarySkeleton } from "@/components/organisms/taxonomy-summary/taxonomy-summary-skeleton";

import { brucellaTaxonomyConfig as config } from "../_config";

async function TaxonomySummaryBoundary() {
  return withSectionError(() => TaxonomySummary({ taxonId: config.taxonId }));
}

async function MetadataDistributionsBoundary() {
  return withSectionError(() =>
    MetadataDistributions({
      taxonId: config.taxonId,
      fields: config.metadataFields,
    }),
  );
}

async function GeoDistributionBoundary() {
  return withSectionError(() =>
    GeoDistribution({ taxonId: config.taxonId, accent: config.accent }),
  );
}

async function ReferenceGenomesBoundary() {
  return withSectionError(() => ReferenceGenomes({ taxonId: config.taxonId }));
}

export function OverviewView() {
  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<TaxonomySummarySkeleton />}>
        <TaxonomySummaryBoundary />
      </Suspense>

      <div className="flex flex-col gap-8 xl:flex-row xl:items-stretch">
        <section className="flex w-full flex-col gap-3 xl:w-[70%]">
          <div>
            <h2 className="text-lg font-semibold tracking-normal">
              Geographic Distribution
            </h2>
            <p className="text-muted-foreground text-sm">
              Genome counts by country, US state, and county.
            </p>
          </div>
          <Suspense fallback={<GeoDistributionSkeleton />}>
            <GeoDistributionBoundary />
          </Suspense>
        </section>

        <section className="flex w-full flex-col gap-3 xl:h-182 xl:w-[30%] xl:overflow-hidden">
          <div>
            <h2 className="text-lg font-semibold tracking-normal">
              Reference & Representative Genomes
            </h2>
            <p className="text-muted-foreground text-sm">
              Curated reference and representative genome records for this
              taxon.
            </p>
          </div>
          <Suspense fallback={<ReferenceGenomesSkeleton />}>
            <ReferenceGenomesBoundary />
          </Suspense>
        </section>
      </div>

      <Suspense fallback={<MetadataDistributionsSkeleton />}>
        <MetadataDistributionsBoundary />
      </Suspense>
    </div>
  );
}
