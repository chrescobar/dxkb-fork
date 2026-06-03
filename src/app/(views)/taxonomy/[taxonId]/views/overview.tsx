import { Suspense } from "react";

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

async function ReferenceGenomesBoundary() {
  return withSectionError(() => ReferenceGenomes({ taxonId: config.taxonId }));
}

export function OverviewView() {
  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<TaxonomySummarySkeleton />}>
        <TaxonomySummaryBoundary />
      </Suspense>

      <Suspense fallback={<MetadataDistributionsSkeleton />}>
        <MetadataDistributionsBoundary />
      </Suspense>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">
            Reference & Representative Genomes
          </h2>
          <p className="text-muted-foreground text-base">
            Curated reference and representative genome records for this taxon.
          </p>
        </div>
        <Suspense fallback={<ReferenceGenomesSkeleton />}>
          <ReferenceGenomesBoundary />
        </Suspense>
      </section>
    </div>
  );
}
