import { fetchOrganismMetadataFacets } from "@/lib/services/organisms/metadata-facets";

import { DonutChart } from "./donut-chart";

const fieldLabels: Record<string, string> = {
  genus: "Genus",
  host_name: "Host",
  host_group: "Host",
  isolation_country: "Isolation Country",
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
        <h2 className="text-2xl font-semibold tracking-normal">
          Metadata Distributions
        </h2>
        <p className="text-base text-muted-foreground">
          Top metadata buckets for available genome records.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 @[640px]:grid-cols-2 @[1080px]:grid-cols-3">
        {fields.map((field) => (
          <DonutChart
            key={field}
            title={fieldLabels[field] ?? field}
            data={(facets[field] ?? []).map((facet) => ({
              label: facet.name,
              value: facet.count,
            }))}
          />
        ))}
      </div>
    </section>
  );
}
