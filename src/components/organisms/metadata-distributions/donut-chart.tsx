"use client";

import { Group } from "@visx/group";
import { scaleOrdinal } from "@visx/scale";
import { Pie } from "@visx/shape";
import { useTooltip } from "@visx/tooltip";

import { facetDisplayLabel } from "@/components/organisms/facet-label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DonutDatum {
  label: string;
  value: number;
}

interface DonutChartProps {
  title: string;
  data: DonutDatum[];
}

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

const numberFormatter = new Intl.NumberFormat("en-US");

function chartData(data: DonutDatum[]): DonutDatum[] {
  const positive = data
    .filter((datum) => datum.value > 0)
    .map((datum) => ({
      ...datum,
      label: facetDisplayLabel(datum.label),
    }));
  const top = positive.slice(0, 5);
  const otherValue = positive
    .slice(5)
    .reduce((sum, datum) => sum + datum.value, 0);
  return otherValue > 0
    ? [...top, { label: "Others", value: otherValue }]
    : top;
}

export function DonutChart({ title, data }: DonutChartProps) {
  const slices = chartData(data);
  const total = slices.reduce((sum, datum) => sum + datum.value, 0);
  const colorScale = scaleOrdinal<string, string>({
    domain: slices.map((datum) => datum.label),
    range: chartColors,
  });
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<DonutDatum>();

  return (
    <Card className="relative rounded-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {total > 0
            ? `${numberFormatter.format(total)} records in shown buckets`
            : "No facet data"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {slices.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No distribution data was returned.
          </p>
        ) : (
          <div className="grid min-w-0 items-center gap-4 md:grid-cols-[minmax(120px,180px)_minmax(0,1fr)]">
            <svg
              viewBox="0 0 180 180"
              role="img"
              aria-label={`${title} distribution`}
              className="aspect-square w-full max-w-[180px]"
            >
              <Group top={90} left={90}>
                <Pie<DonutDatum>
                  data={slices}
                  pieValue={(datum) => datum.value}
                  outerRadius={84}
                  innerRadius={48}
                  padAngle={0.012}
                >
                  {(pie) =>
                    pie.arcs.map((arc) => (
                      <path
                        key={arc.data.label}
                        suppressHydrationWarning
                        d={pie.path(arc) ?? undefined}
                        fill={colorScale(arc.data.label)}
                        stroke="var(--card)"
                        strokeWidth={2}
                        tabIndex={0}
                        aria-label={`${arc.data.label}: ${numberFormatter.format(arc.data.value)}`}
                        onMouseMove={(event) =>
                          showTooltip({
                            tooltipData: arc.data,
                            tooltipLeft: event.clientX,
                            tooltipTop: event.clientY,
                          })
                        }
                        onFocus={() =>
                          showTooltip({
                            tooltipData: arc.data,
                            tooltipLeft: 0,
                            tooltipTop: 0,
                          })
                        }
                        onMouseLeave={hideTooltip}
                        onBlur={hideTooltip}
                      />
                    ))
                  }
                </Pie>
              </Group>
            </svg>
            <ul className="flex min-w-0 flex-col gap-2">
              {slices.map((datum) => (
                <li
                  key={datum.label}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: colorScale(datum.label) }}
                    />
                    <span className="truncate">{datum.label}</span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {numberFormatter.format(datum.value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      {tooltipData && (
        <div
          role="status"
          className="bg-popover text-popover-foreground pointer-events-none fixed rounded-md border px-2 py-1 text-xs shadow-md"
          style={{ left: tooltipLeft ?? 0, top: tooltipTop ?? 0 }}
        >
          {tooltipData.label}: {numberFormatter.format(tooltipData.value)}
        </div>
      )}
    </Card>
  );
}
