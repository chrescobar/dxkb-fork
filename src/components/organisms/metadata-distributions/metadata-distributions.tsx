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

  const taxonomicData =
    taxonomicResult.status === "fulfilled" ? taxonomicResult.value : emptyTaxonomic;
  if (taxonomicResult.status === "rejected") {
    console.warn(
      `[metadata-distributions] taxonomic distribution fetch failed for taxonId=${taxonId}:`,
      taxonomicResult.reason,
    );
  }

  const cgmlstData =
    cgmlstResult.status === "fulfilled" ? cgmlstResult.value : emptyCgmlst();
  if (cgmlstResult.status === "rejected") {
    console.warn(
      `[metadata-distributions] cgMLST distribution fetch failed for taxonId=${taxonId}:`,
      cgmlstResult.reason,
    );
  }

  const amrData =
    amrResult.status === "fulfilled" ? amrResult.value : emptyAmrData;
  if (amrResult.status === "rejected" && showAmr) {
    console.warn(
      `[metadata-distributions] amr phenotype distribution fetch failed for taxonId=${taxonId}:`,
      amrResult.reason,
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
      {showAmr && (
        <AmrBarStackChart
          title="Antimicrobial Resistance Profile"
          data={amrData}
        />
      )}
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
        <DonutChart
          title="Taxonomic Distribution"
          tabs={[
            {
              label: "Genus",
              data: taxonomicData.genus.map((f) => ({
                label: f.name,
                value: f.count,
              })),
            },
            {
              label: "Species",
              data: taxonomicData.species.map((f) => ({
                label: f.name,
                value: f.count,
              })),
            },
          ]}
          layout="side"
        />
        <DonutChart
          title="cgMLST HC Distribution"
          tabs={hcLevels.map((level) => ({
            label: level.toUpperCase(),
            data: cgmlstData[level].map((f) => ({
              label: f.name,
              value: f.count,
            })),
          }))}
          layout="side"
        />
      </div>
    </section>
  );
}
