"use client";

import { useRef } from "react";

import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { AreaClosed, LinePath } from "@visx/shape";
import { useTooltip } from "@visx/tooltip";
import { curveMonotoneX } from "@visx/vendor/d3-shape";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { chartTooltipStyle, numberFormatter } from "@/lib/services/organisms/utils";

interface YearDatum {
  year: number;
  count: number;
}

interface CollectionYearAreaChartProps {
  title: string;
  data: { label: string; value: number }[];
}

const chartWidth = 540;
const chartHeight = 260;
const marginTop = 10;
const marginRight = 20;
const marginBottom = 32;
const marginLeft = 54;
const innerWidth = chartWidth - marginLeft - marginRight;
const innerHeight = chartHeight - marginTop - marginBottom;
const gradientId = "collection-year-area-gradient";

function labelStep(count: number): number {
  if (count <= 15) return 1;
  if (count <= 30) return 2;
  if (count <= 60) return 5;
  return 10;
}

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
  const svgRef = useRef<SVGSVGElement>(null);
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
  const step = labelStep(yearData.length);

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
              ref={svgRef}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              role="img"
              aria-label={`${title} distribution`}
              className="w-full"
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
                      onFocus={(event) => {
                        const rect =
                          event.currentTarget.getBoundingClientRect();
                        showTooltip({
                          tooltipData: d,
                          tooltipLeft: rect.left + rect.width / 2,
                          tooltipTop: rect.top + rect.height / 2,
                        });
                      }}
                      onBlur={hideTooltip}
                    >
                      <title>{label}</title>
                    </circle>
                  );
                })}

                {yearData.map((d, i) => {
                  if (i % step !== 0) return null;
                  return (
                    <text
                      key={`label-${d.year}`}
                      x={xScale(d.year) ?? 0}
                      y={innerHeight + 12}
                      textAnchor="middle"
                      dominantBaseline="hanging"
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

                {tooltipData && (() => {
                  const hx = xScale(tooltipData.year) ?? 0;
                  const colW =
                    yearData.length > 1
                      ? innerWidth / (yearData.length - 1)
                      : innerWidth;
                  return (
                    <rect
                      x={hx - colW / 2}
                      y={0}
                      width={colW}
                      height={innerHeight}
                      fill="var(--primary)"
                      fillOpacity={0.12}
                      rx={3}
                      pointerEvents="none"
                    />
                  );
                })()}

                <rect
                  data-testid="chart-overlay"
                  x={0}
                  y={0}
                  width={innerWidth}
                  height={innerHeight}
                  fill="transparent"
                  onMouseMove={(event) => {
                    const svgRect = svgRef.current?.getBoundingClientRect();
                    const scaleX =
                      svgRect && svgRect.width > 0
                        ? chartWidth / svgRect.width
                        : 1;
                    const mouseX = svgRect
                      ? (event.clientX - svgRect.left) * scaleX - marginLeft
                      : event.clientX - marginLeft;
                    const yearValue = xScale.invert(mouseX);
                    const nearest = yearData.reduce((a, b) =>
                      Math.abs(b.year - yearValue) < Math.abs(a.year - yearValue)
                        ? b
                        : a,
                    );
                    showTooltip({
                      tooltipData: nearest,
                      tooltipLeft: event.clientX,
                      tooltipTop: event.clientY,
                    });
                  }}
                  onMouseLeave={hideTooltip}
                />
              </Group>
            </svg>
          </div>
        )}
      </CardContent>
      {tooltipData && (
        <div
          role="status"
          className="bg-popover text-popover-foreground pointer-events-none fixed z-50 rounded-md border px-2 py-1 text-xs shadow-md"
          style={chartTooltipStyle(tooltipLeft ?? 0, tooltipTop ?? 0, 150, 28)}
        >
          {tooltipData.year}: {numberFormatter.format(tooltipData.count)}
        </div>
      )}
    </Card>
  );
}
