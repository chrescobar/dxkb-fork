"use client";

import { useRef } from "react";

import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { useTooltip } from "@visx/tooltip";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { numberFormatter } from "@/lib/services/organisms/utils";

interface YearDatum {
  year: number;
  count: number;
}

interface CollectionYearBarChartProps {
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

export function CollectionYearBarChart({
  title,
  data,
}: CollectionYearBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const yearData = parseYearData(data);
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<YearDatum>();

  const xScale = scaleBand<number>({
    domain: yearData.map((d) => d.year),
    range: [0, innerWidth],
    padding: 0.25,
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

                {yearData.map((d) => {
                  const barX = xScale(d.year) ?? 0;
                  const barWidth = xScale.bandwidth();
                  const barY = yScale(d.count) ?? 0;
                  const barHeight = innerHeight - barY;
                  const label = `${d.year}: ${numberFormatter.format(d.count)}`;

                  return (
                    <rect
                      key={d.year}
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barHeight}
                      fill="var(--chart-1)"
                      rx={2}
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
                    </rect>
                  );
                })}

                {yearData.map((d, i) => {
                  if (i % step !== 0) return null;
                  const labelX = (xScale(d.year) ?? 0) + xScale.bandwidth() / 2;
                  return (
                    <text
                      key={`label-${d.year}`}
                      x={labelX}
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

                {tooltipData && (
                  <line
                    x1={(xScale(tooltipData.year) ?? 0) + xScale.bandwidth() / 2}
                    x2={(xScale(tooltipData.year) ?? 0) + xScale.bandwidth() / 2}
                    y1={0}
                    y2={innerHeight}
                    stroke="var(--muted-foreground)"
                    strokeWidth={1}
                    strokeDasharray="3,3"
                    pointerEvents="none"
                  />
                )}

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
                    const index = Math.max(
                      0,
                      Math.min(
                        yearData.length - 1,
                        Math.round(mouseX / xScale.step()),
                      ),
                    );
                    const d = yearData[index];
                    if (d) {
                      showTooltip({
                        tooltipData: d,
                        tooltipLeft: event.clientX,
                        tooltipTop: event.clientY,
                      });
                    }
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
          className="bg-popover text-popover-foreground pointer-events-none fixed rounded-md border px-2 py-1 text-xs shadow-md"
          style={{ left: tooltipLeft ?? 0, top: tooltipTop ?? 0 }}
        >
          {tooltipData.year}: {numberFormatter.format(tooltipData.count)}
        </div>
      )}
    </Card>
  );
}
