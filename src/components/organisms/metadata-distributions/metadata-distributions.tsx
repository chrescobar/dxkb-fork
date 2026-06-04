import { fetchOrganismMetadataFacets } from "@/lib/services/organisms/metadata-facets";

import { CollectionYearAreaChart } from "./collection-year-area-chart";
import { CollectionYearBarChart } from "./collection-year-bar-chart";
import { DonutChart } from "./donut-chart";

const fieldLabels: Record<string, string> = {
  genus: "Genus",
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
}

export async function MetadataDistributions({
  taxonId,
  fields,
}: MetadataDistributionsProps) {
  const facets = await fetchOrganismMetadataFacets(taxonId, fields);

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
              <CollectionYearBarChart
                key={`${field}-bar`}
                title={`${title} (Bar)`}
                data={data}
              />,
              <CollectionYearAreaChart
                key={`${field}-area`}
                title={`${title} (Area)`}
                data={data}
              />,
            ];
          }

          return [<DonutChart key={field} title={title} data={data} />];
        })}
      </div>
    </section>
  );
}
