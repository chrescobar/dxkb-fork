import { fetchAmrPhenotypeDistribution } from "@/lib/services/organisms/amr-distribution";
import {
  fetchCgmlstHcDistribution,
  hcLevels,
} from "@/lib/services/organisms/cgmlst-distribution";
import type { CgmlstHcDistribution } from "@/lib/services/organisms/cgmlst-distribution";
import { fetchOrganismMetadataFacets } from "@/lib/services/organisms/metadata-facets";
import { fetchSerotypeDistribution } from "@/lib/services/organisms/serotype-distribution";
import { fetchTaxonomicDistribution } from "@/lib/services/organisms/taxonomic-distribution";
import type {
  AmrDistributionData,
  SerotypeDistributionData,
} from "@/lib/services/organisms/types";

import { AmrBarStackChart } from "./amr-bar-stack-chart";
import { AreaChart } from "./area-chart";
import { BarChart } from "./bar-chart";
import { BarStackChart } from "./bar-stack-chart";
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
  serovar: "Serotypes",
};

interface MetadataDistributionsProps {
  taxonId: number;
  fields: string[];
  showSerotype?: boolean;
  showAmr?: boolean;
}

const emptySerotypeData: SerotypeDistributionData = { years: [], serovars: [] };
const emptyAmrData: AmrDistributionData = { antibiotics: [] };
const emptyTaxonomic = { genus: [], species: [] };

function emptyCgmlst(): CgmlstHcDistribution {
  return Object.fromEntries(
    hcLevels.map((l) => [l, [] as never[]]),
  ) as unknown as CgmlstHcDistribution;
}

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
  showSerotype = false,
  showAmr = false,
}: MetadataDistributionsProps) {
  const [facetsResult, serotypeResult, taxonomicResult, cgmlstResult, amrResult] =
    await Promise.allSettled([
      fetchOrganismMetadataFacets(taxonId, fields),
      showSerotype
        ? fetchSerotypeDistribution(taxonId)
        : Promise.resolve(emptySerotypeData),
      fetchTaxonomicDistribution(taxonId),
      fetchCgmlstHcDistribution(taxonId),
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
  const serotype = settledToChart(serotypeResult, emptySerotypeData);
  const taxonomic = settledToChart(taxonomicResult, emptyTaxonomic);
  const cgmlst = settledToChart(cgmlstResult, emptyCgmlst());
  const amr = settledToChart(amrResult, emptyAmrData);

  // Console signals for ops/log aggregation — the user-visible error message
  // is shown inline in the corresponding chart card.
  if (serotype.errorMessage && showSerotype) {
    console.warn(
      `[metadata-distributions] serotype fetch failed for taxonId=${taxonId}: ${serotype.errorMessage}`,
    );
  }
  if (taxonomic.errorMessage) {
    console.warn(
      `[metadata-distributions] taxonomic distribution fetch failed for taxonId=${taxonId}: ${taxonomic.errorMessage}`,
    );
  }
  if (cgmlst.errorMessage) {
    console.warn(
      `[metadata-distributions] cgMLST distribution fetch failed for taxonId=${taxonId}: ${cgmlst.errorMessage}`,
    );
  }
  if (amr.errorMessage && showAmr) {
    console.warn(
      `[metadata-distributions] amr phenotype distribution fetch failed for taxonId=${taxonId}: ${amr.errorMessage}`,
    );
  }

  return (
    <section className="@container flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-normal">
          Metadata Distributions
        </h2>
        <p className="text-muted-foreground text-sm">
          Top metadata buckets for available genome records.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 @[640px]:grid-cols-2 @[1080px]:grid-cols-3">
        {showAmr && (
          <div className="@[1080px]:col-span-2">
            <AmrBarStackChart
              title="Antimicrobial Resistance Profile"
              data={amr.data}
              errorMessage={amr.errorMessage}
            />
          </div>
        )}
        {fields.flatMap((field) => {
          const title = fieldLabels[field] ?? field;
          const data = (facets[field] ?? []).map((facet) => ({
            label: facet.name,
            value: facet.count,
          }));

          if (field === "collection_year") {
            return [
              <BarChart
                key={`${field}-bar`}
                title={`${title} (Bar)`}
                data={data}
              />,
              <AreaChart
                key={`${field}-area`}
                title={`${title} (Area)`}
                data={data}
              />,
            ];
          }

          return [
            <DonutChart key={field} title={title} data={data} layout="side" />,
          ];
        })}
        {showSerotype && (
          <BarStackChart
            title="Serotype Distribution (Last 10 Years)"
            data={serotype.data}
            errorMessage={serotype.errorMessage}
          />
        )}
        <DonutChart
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
        <DonutChart
          title="cgMLST HC Distribution"
          tabs={hcLevels.map((level) => ({
            label: level.toUpperCase(),
            data: cgmlst.data[level].map((f) => ({
              label: f.name,
              value: f.count,
            })),
          }))}
          layout="side"
          errorMessage={cgmlst.errorMessage}
        />
      </div>
    </section>
  );
}
