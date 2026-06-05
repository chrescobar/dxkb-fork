"use client";

import { useRef } from "react";

import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { AreaClosed, LinePath } from "@visx/shape";
import { useTooltip } from "@visx/tooltip";
import { curveMonotoneX } from "@visx/vendor/d3-shape";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { chartTooltipStyle, numberFormatter } from "@/lib/services/organisms/utils";

import {
  chartMarginLeft,
  chartMarginTop,
  chartWidth,
  yearChartHeight,
  yearInnerHeight,
  yearInnerWidth,
} from "./_shared/chart-dimensions";
import { YAxisTicks } from "./_shared/y-axis-ticks";
import { labelStep, parseYearData, type YearDatum } from "./_shared/year-data";

interface AreaChartProps {
  title: string;
  data: { label: string; value: number }[];
}

const gradientId = "collection-year-area-gradient";

export function AreaChart({
  title,
  data,
}: AreaChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const yearData = parseYearData(data);
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<YearDatum>();

  const xMin = yearData.length > 0 ? yearData[0].year : 0;
  const xMax = yearData.length > 0 ? yearData[yearData.length - 1].year : 1;
  const xScale = scaleLinear<number>({
    domain: [xMin, xMax],
    range: [0, yearInnerWidth],
  });

  const maxCount = Math.max(...yearData.map((d) => d.count), 1);
  const yScale = scaleLinear<number>({
    domain: [0, maxCount],
    range: [yearInnerHeight, 0],
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
              viewBox={`0 0 ${chartWidth} ${yearChartHeight}`}
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
              <Group left={chartMarginLeft} top={chartMarginTop}>
                <YAxisTicks ticks={yTicks} yScale={yScale} innerWidth={yearInnerWidth} />

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
                      y={yearInnerHeight + 12}
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
                  x2={yearInnerWidth}
                  y1={yearInnerHeight}
                  y2={yearInnerHeight}
                  stroke="var(--border)"
                  strokeWidth={1}
                />

                {tooltipData && yearData.length > 1 && (() => {
                  const hx = xScale(tooltipData.year) ?? 0;
                  const colW = yearInnerWidth / (yearData.length - 1);
                  return (
                    <rect
                      x={hx - colW / 2}
                      y={0}
                      width={colW}
                      height={yearInnerHeight}
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
                  width={yearInnerWidth}
                  height={yearInnerHeight}
                  fill="transparent"
                  onMouseMove={(event) => {
                    const svgRect = svgRef.current?.getBoundingClientRect();
                    const scaleX =
                      svgRect && svgRect.width > 0
                        ? chartWidth / svgRect.width
                        : 1;
                    const mouseX = svgRect
                      ? (event.clientX - svgRect.left) * scaleX - chartMarginLeft
                      : event.clientX - chartMarginLeft;
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
