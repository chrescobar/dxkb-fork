import { fetchOrganismMetadataFacets } from "@/lib/services/organisms/metadata-facets";

import { DonutChart } from "./donut-chart";

const fieldLabels: Record<string, string> = {
  genus: "Genus",
  host_name: "Host",
  isolation_country: "Isolation Country",
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
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-normal">
          Metadata Distributions
        </h2>
        <p className="text-muted-foreground text-sm">
          Top metadata buckets for available genome records.
        </p>
      </div>
      <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
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
