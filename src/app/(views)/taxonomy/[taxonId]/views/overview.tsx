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
import type { OrganismLandingConfig } from "@/components/organisms/types";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

interface OverviewViewProps {
  config: OrganismLandingConfig;
  taxon: OrganismTaxonomy | null;
  showSerotype?: boolean;
}

export function makeOverviewView({ config, taxon, showSerotype }: OverviewViewProps) {
  async function TaxonomySummaryBoundary() {
    return withSectionError(() => TaxonomySummary({ taxonId: config.taxonId, taxon }));
  }

  async function MetadataDistributionsBoundary() {
    return withSectionError(() =>
      MetadataDistributions({
        taxonId: config.taxonId,
        fields: config.metadataFields,
        showSerotype,
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

  function OverviewView() {
    return (
      <div className="flex flex-col gap-8">
        <Suspense fallback={<TaxonomySummarySkeleton />}>
          <TaxonomySummaryBoundary />
        </Suspense>

        <div className="flex flex-col gap-8 xl:flex-row xl:items-stretch xl:max-h-167">
          <section className="flex w-full flex-col xl:w-[70%]">
            <Suspense fallback={<GeoDistributionSkeleton />}>
              <GeoDistributionBoundary />
            </Suspense>
          </section>

          <section className="flex w-full flex-col xl:w-[30%] xl:min-w-0">
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

  return OverviewView;
}
