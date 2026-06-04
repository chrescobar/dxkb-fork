"use client";

import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { AreaClosed, LinePath } from "@visx/shape";
import { useTooltip } from "@visx/tooltip";
import { curveMonotoneX } from "@visx/vendor/d3-shape";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { numberFormatter } from "@/lib/services/organisms/utils";

interface YearDatum {
  year: number;
  count: number;
}

interface CollectionYearAreaChartProps {
  title: string;
  data: { label: string; value: number }[];
}

const chartWidth = 540;
const chartHeight = 220;
const marginTop = 10;
const marginRight = 20;
const marginBottom = 40;
const marginLeft = 54;
const innerWidth = chartWidth - marginLeft - marginRight;
const innerHeight = chartHeight - marginTop - marginBottom;
const gradientId = "collection-year-area-gradient";

function parseYearData(data: { label: string; value: number }[]): YearDatum[] {
  return data
    .filter((d) => Number.isInteger(Number(d.label)) && d.label.trim() !== "")
    .map((d) => ({ year: Number(d.label), count: d.value }))
    .sort((a, b) => a.year - b.year);
}

export function CollectionYearAreaChart({
  title,
  data,
}: CollectionYearAreaChartProps) {
  const yearData = parseYearData(data);
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<YearDatum>();

  const xMin = yearData.length > 0 ? yearData[0].year : 0;
  const xMax = yearData.length > 0 ? yearData[yearData.length - 1].year : 1;
  const xScale = scaleLinear<number>({
    domain: [xMin, xMax],
    range: [0, innerWidth],
  });

  const maxCount = Math.max(...yearData.map((d) => d.count), 1);
  const yScale = scaleLinear<number>({
    domain: [0, maxCount],
    range: [innerHeight, 0],
    nice: true,
  });

  const yTicks = yScale.ticks(4);
  const skipEveryOther = yearData.length > 8;

  return (
    <Card className="relative rounded-lg" size="sm">
      <CardHeader>
        <CardTitle className="text-lg!">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {yearData.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No distribution data was returned.
          </p>
        ) : (
          <div className="min-w-0 overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              role="img"
              aria-label={`${title} distribution`}
              className="mx-auto w-full max-w-135"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Group left={marginLeft} top={marginTop}>
                {yTicks.map((tick) => (
                  <g key={tick}>
                    <line
                      x1={0}
                      x2={innerWidth}
                      y1={yScale(tick)}
                      y2={yScale(tick)}
                      stroke="var(--border)"
                      strokeWidth={1}
                    />
                    <text
                      x={-6}
                      y={yScale(tick)}
                      textAnchor="end"
                      dominantBaseline="middle"
                      fontSize={11}
                      className="fill-muted-foreground tabular-nums"
                    >
                      {numberFormatter.format(tick)}
                    </text>
                  </g>
                ))}

                <AreaClosed<YearDatum>
                  data={yearData}
                  x={(d) => xScale(d.year) ?? 0}
                  y={(d) => yScale(d.count) ?? 0}
                  yScale={yScale}
                  fill={`url(#${gradientId})`}
                  curve={curveMonotoneX}
                />

                <LinePath<YearDatum>
                  data={yearData}
                  x={(d) => xScale(d.year) ?? 0}
                  y={(d) => yScale(d.count) ?? 0}
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  curve={curveMonotoneX}
                />

                {yearData.map((d) => {
                  const cx = xScale(d.year) ?? 0;
                  const cy = yScale(d.count) ?? 0;
                  const label = `${d.year}: ${numberFormatter.format(d.count)}`;

                  return (
                    <circle
                      key={d.year}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill="var(--chart-1)"
                      stroke="var(--card)"
                      strokeWidth={2}
                      tabIndex={0}
                      aria-label={label}
                      onMouseMove={(event) =>
                        showTooltip({
                          tooltipData: d,
                          tooltipLeft: event.clientX,
                          tooltipTop: event.clientY,
                        })
                      }
                      onFocus={(event) => {
                        const rect =
                          event.currentTarget.getBoundingClientRect();
                        showTooltip({
                          tooltipData: d,
                          tooltipLeft: rect.left + rect.width / 2,
                          tooltipTop: rect.top + rect.height / 2,
                        });
                      }}
                      onMouseLeave={hideTooltip}
                      onBlur={hideTooltip}
                    >
                      <title>{label}</title>
                    </circle>
                  );
                })}

                {yearData.map((d, i) => {
                  if (skipEveryOther && i % 2 !== 0) return null;
                  return (
                    <text
                      key={d.year}
                      x={xScale(d.year) ?? 0}
                      y={innerHeight + 16}
                      textAnchor="middle"
                      fontSize={11}
                      className="fill-muted-foreground tabular-nums"
                    >
                      {d.year}
                    </text>
                  );
                })}

                <line
                  x1={0}
                  x2={innerWidth}
                  y1={innerHeight}
                  y2={innerHeight}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
              </Group>
            </svg>
          </div>
        )}
      </CardContent>
      {tooltipData && (
        <div
          role="status"
          className="bg-popover text-popover-foreground pointer-events-none fixed rounded-md border px-2 py-1 text-xs shadow-md"
          style={{ left: tooltipLeft ?? 0, top: tooltipTop ?? 0 }}
        >
          {tooltipData.year}: {numberFormatter.format(tooltipData.count)}
        </div>
      )}
    </Card>
  );
}
