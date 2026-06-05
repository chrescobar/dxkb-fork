import { fetchOrganismMetadataFacets } from "@/lib/services/organisms/metadata-facets";
import { fetchSerotypeDistribution } from "@/lib/services/organisms/serotype-distribution";
import type { SerotypeDistributionData } from "@/lib/services/organisms/types";

import { AreaChart } from "./area-chart";
import { BarChart } from "./bar-chart";
import { BarStackChart } from "./bar-stack-chart";
import { DonutChart } from "./donut-chart";

const fieldLabels: Record<string, string> = {
  genus: "Genus",
  host: "Host",
  host_name: "Host Name",
  host_group: "Host Group",
  isolation_country: "Isolation Country",
  isolation_source: "Isolation Source",
  collection_year: "Collection Year",
  family: "Family",
};

interface MetadataDistributionsProps {
  taxonId: number;
  fields: string[];
  showSerotype?: boolean;
}

const emptySerotypeData: SerotypeDistributionData = { years: [], serovars: [] };

export async function MetadataDistributions({
  taxonId,
  fields,
  showSerotype = false,
}: MetadataDistributionsProps) {
  const [facetsResult, serotypeResult] = await Promise.allSettled([
    fetchOrganismMetadataFacets(taxonId, fields),
    showSerotype
      ? fetchSerotypeDistribution(taxonId)
      : Promise.resolve(emptySerotypeData),
  ]);

  if (facetsResult.status === "rejected") {
    throw facetsResult.reason;
  }

  const facets = facetsResult.value;
  const serotypeData =
    serotypeResult.status === "fulfilled" ? serotypeResult.value : emptySerotypeData;
  if (serotypeResult.status === "rejected" && showSerotype) {
    console.warn(
      `[metadata-distributions] serotype fetch failed for taxonId=${taxonId}:`,
      serotypeResult.reason,
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
            data={serotypeData}
          />
        )}
      </div>
    </section>
  );
}
