import { fetchAmrPhenotypeDistribution } from "@/lib/services/organisms/amr-distribution";
import { fetchOrganismMetadataFacets } from "@/lib/services/organisms/metadata-facets";
import { fetchTaxonomicDistribution } from "@/lib/services/organisms/taxonomic-distribution";
import type { AmrDistributionData } from "@/lib/services/organisms/types";

import { taxonomicDistributionSentinel } from "@/components/organisms/types";

import { AmrBarStackChart } from "./amr-bar-stack-chart";
import { BarChart } from "./bar-chart";
import { DonutChart } from "./donut-chart";

const fieldLabels: Record<string, string> = {
  genus: "Genus",
  host: "Host",
  host_name: "Host Name",
  host_group: "Host Group",
  host_common_name: "Host Distribution",
  isolation_country: "Isolation Country",
  isolation_source: "Isolation Source Distribution",
  collection_year: "Collection Year",
  family: "Family",
  sequencing_centers: "Sequencing Centers",
};

interface MetadataDistributionsProps {
  taxonId: number;
  fields: string[];
  showAmr?: boolean;
}

const emptyAmrData: AmrDistributionData = { antibiotics: [] };

interface OptionalChartState<T> {
  data: T;
  errorMessage?: string;
}

function settledToChart<T>(
  result: PromiseSettledResult<T>,
  fallback: T,
): OptionalChartState<T> {
  if (result.status === "fulfilled") return { data: result.value };
  const reason = result.reason;
  const message =
    reason instanceof Error ? reason.message : String(reason ?? "unknown error");
  return { data: fallback, errorMessage: message };
}

export async function MetadataDistributions({
  taxonId,
  fields,
  showAmr = false,
}: MetadataDistributionsProps) {
  const hasTaxonomicSentinel = fields.includes(taxonomicDistributionSentinel);
  const fetchFields = fields.filter((f) => f !== taxonomicDistributionSentinel);

  const [facetsResult, taxonomicResult, amrResult] =
    await Promise.allSettled([
      fetchOrganismMetadataFacets(taxonId, fetchFields),
      fetchTaxonomicDistribution(taxonId),
      showAmr
        ? fetchAmrPhenotypeDistribution(taxonId)
        : Promise.resolve(emptyAmrData),
    ]);

  // The facets panel is the spine of this section — if it fails we can't lay
  // out the rest of the grid, so propagate to the route's error boundary.
  if (facetsResult.status === "rejected") {
    throw facetsResult.reason;
  }

  const facets = facetsResult.value;
  const taxonomic = settledToChart(taxonomicResult, { genus: [], species: [] });
  const amr = settledToChart(amrResult, emptyAmrData);

  if (taxonomic.errorMessage) {
    console.warn(
      `[metadata-distributions] taxonomic distribution fetch failed for taxonId=${taxonId}: ${taxonomic.errorMessage}`,
    );
  }
  if (amr.errorMessage && showAmr) {
    console.warn(
      `[metadata-distributions] amr phenotype distribution fetch failed for taxonId=${taxonId}: ${amr.errorMessage}`,
    );
  }

  const amrHasData = amr.data.antibiotics.length > 0;

  const taxonomicChart = (
    <DonutChart
      key={taxonomicDistributionSentinel}
      title="Taxonomic Distribution"
      tabs={[
        {
          label: "Genus",
          data: taxonomic.data.genus.map((f) => ({
            label: f.name,
            value: f.count,
          })),
        },
        {
          label: "Species",
          data: taxonomic.data.species.map((f) => ({
            label: f.name,
            value: f.count,
          })),
        },
      ]}
      layout="side"
      errorMessage={taxonomic.errorMessage}
    />
  );

  return (
    <section className="@container flex flex-col gap-3" data-testid="metadata-distributions">
      <div>
        <h2 className="text-lg font-semibold tracking-normal">
          Metadata Distributions
        </h2>
        <p className="text-muted-foreground text-sm">
          Top metadata buckets for available genome records.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 @[640px]:grid-cols-2 @[1080px]:grid-cols-3 @[1600px]:grid-cols-4">
        {fields.flatMap((field) => {
          if (field === taxonomicDistributionSentinel) {
            return [taxonomicChart];
          }

          const title = fieldLabels[field] ?? field;
          const data = (facets[field] ?? []).map((facet) => ({
            label: facet.name,
            value: facet.count,
          }));

          if (field === "collection_year") {
            return [
              <BarChart
                key={`${field}-bar`}
                title={title}
                data={data}
              />,
            ];
          }

          return [
            <DonutChart key={field} title={title} data={data} layout="side" />,
          ];
        })}
        {!hasTaxonomicSentinel && taxonomicChart}
        {showAmr && (
          <div className={`flex flex-col${amrHasData ? " @[640px]:col-span-2 @[1080px]:col-span-2" : ""}`}>
            <AmrBarStackChart
              title="Antimicrobial Resistance Profile"
              data={amr.data}
              errorMessage={amr.errorMessage}
            />
          </div>
        )}
      </div>
    </section>
  );
}
