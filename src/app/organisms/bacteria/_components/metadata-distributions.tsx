import { Globe, BarChart3, AlignJustify } from "lucide-react";
import {
  fetchGenusFacet,
  fetchHostFacet,
  fetchCountryFacet,
  type FacetDistribution,
} from "@/lib/services/bacteria";
import { DonutChart, donutColorVar } from "./donut-chart";
import { SectionError } from "./section-error";
import { formatCount, formatCountFull } from "../_lib/format";
import type { DonutSlice } from "../_data/metadata-distributions";

const sliceColors: DonutSlice["color"][] = ["c1", "c2", "c3", "c4", "c5"];

interface DistributionCardProps {
  title: string;
  caption: string;
  distribution: FacetDistribution;
}

function buildSlices(distribution: FacetDistribution): DonutSlice[] {
  const slices: DonutSlice[] = distribution.topSlices.map(([label, count], index) => ({
    label: label === "" ? "(unspecified)" : label,
    value: formatCountFull(count),
    pct: distribution.total > 0 ? (count / distribution.total) * 100 : 0,
    color: sliceColors[index % sliceColors.length],
  }));
  if (distribution.othersCount > 0) {
    slices.push({
      label: "Others",
      value: formatCountFull(distribution.othersCount),
      pct: distribution.total > 0 ? (distribution.othersCount / distribution.total) * 100 : 0,
      color: "muted",
    });
  }
  return slices;
}

function DistributionCard({ title, caption, distribution }: DistributionCardProps) {
  const slices = buildSlices(distribution);
  return (
    <div className="bacteria-card bacteria-card-hover p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[14px] font-semibold">{title}</h3>
        <span className="font-mono text-[10.5px] text-muted-foreground">
          n = {formatCount(distribution.total)}
        </span>
      </div>
      <p className="text-[12px] mb-4 text-muted-foreground">{caption}</p>
      <div className="flex items-center justify-center mb-4">
        <DonutChart slices={slices} total={formatCount(distribution.total)} />
      </div>
      <ul className="text-[12.5px]">
        {slices.map((slice) => (
          <li
            key={slice.label}
            className="bacteria-legend-row"
            style={slice.color === "muted" ? { color: "var(--muted-foreground)" } : undefined}
          >
            <span className="flex items-center gap-2">
              <span className="swatch" style={{ background: donutColorVar[slice.color] }} />
              {slice.label}
            </span>
            <span className="font-mono bacteria-tabular text-muted-foreground">{slice.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function MetadataDistributions() {
  const [genusResult, hostResult, countryResult] = await Promise.allSettled([
    fetchGenusFacet(),
    fetchHostFacet(),
    fetchCountryFacet(),
  ]);

  const renderResult = (
    title: string,
    caption: string,
    result: PromiseSettledResult<FacetDistribution>,
  ) => {
    if (result.status === "fulfilled") {
      return (
        <DistributionCard key={title} title={title} caption={caption} distribution={result.value} />
      );
    }
    const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
    return (
      <div key={title} className="bacteria-card p-5">
        <SectionError title={`Couldn't load ${title}`} message={message} />
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-[19px] font-medium flex items-center gap-2">
            <Globe className="size-[18px]" style={{ color: "var(--primary)" }} />
            Bacteria by Metadata
          </h2>
          <p className="text-[13px] mt-1 text-muted-foreground">
            Distribution across genus, host, and isolation country
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="bacteria-icon-btn"
            data-active="true"
            title="Chart view"
            aria-label="Chart view"
          >
            <Globe className="size-3.5" />
          </button>
          <button type="button" className="bacteria-icon-btn" title="Bar view" aria-label="Bar view">
            <BarChart3 className="size-3.5" />
          </button>
          <button type="button" className="bacteria-icon-btn" title="Table view" aria-label="Table view">
            <AlignJustify className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {renderResult("Genus", "Top 5 by count", genusResult)}
        {renderResult("Host", "Top 5 raw labels (no normalization)", hostResult)}
        {renderResult("Isolation Country", "Top 5 by count", countryResult)}
      </div>
    </div>
  );
}
