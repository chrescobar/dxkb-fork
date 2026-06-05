"use client";

import { useRef, useState } from "react";

import { Group } from "@visx/group";
import { scaleBand, scaleLinear, scaleOrdinal } from "@visx/scale";
import { BarStack } from "@visx/shape";
import { useTooltip } from "@visx/tooltip";

import { Card, CardContent } from "@/components/ui/card";
import type { SerotypeDistributionData, SerotypeYear } from "@/lib/services/organisms/types";
import { numberFormatter } from "@/lib/services/organisms/utils";
import { cn } from "@/lib/utils";

interface ColumnTooltipRow {
  serovar: string;
  count: number;
  color: string;
}

interface ColumnTooltipData {
  year: number;
  rows: ColumnTooltipRow[];
}

interface SerotypeDistributionChartProps {
  title: string;
  data: SerotypeDistributionData;
}

const chartWidth = 540;
const chartHeight = 300;
const marginTop = 10;
const marginRight = 20;
const marginBottom = 32;
const marginLeft = 54;
const innerWidth = chartWidth - marginLeft - marginRight;
const innerHeight = chartHeight - marginTop - marginBottom;

const chartColors = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)",
  "var(--chart-5)", "var(--chart-6)", "var(--chart-7)", "var(--chart-8)",
  "var(--chart-9)", "var(--chart-10)",
];

const tooltipOffsetX = 12;
const tooltipOffsetY = -44;

export function SerotypeDistributionChart({
  title,
  data,
}: SerotypeDistributionChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [lockedIdx, setLockedIdx] = useState<number | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<ColumnTooltipData>();

  if (data.years.length === 0) {
    return (
      <Card className="relative rounded-lg" size="sm">
        <CardContent className="flex flex-1 flex-col">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            No distribution data was returned.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentActive = lockedIdx !== null ? lockedIdx : activeIdx;

  const xScale = scaleBand<number>({
    domain: data.years.map((y) => y.year),
    range: [0, innerWidth],
    padding: 0.25,
  });

  const yMax = Math.max(
    ...data.years.map((y) =>
      data.serovars.reduce((sum, sv) => sum + (y[sv] ?? 0), 0),
    ),
    1,
  );

  const yScale = scaleLinear<number>({
    domain: [0, yMax],
    range: [innerHeight, 0],
    nice: true,
  });

  const colorScale = scaleOrdinal<string, string>({
    domain: data.serovars,
    range: chartColors.slice(0, data.serovars.length),
  });

  const yTicks = yScale.ticks(4);

  function handlePillMouseEnter(idx: number) {
    if (lockedIdx === null) setActiveIdx(idx);
  }

  function handlePillMouseLeave() {
    if (lockedIdx === null) setActiveIdx(null);
  }

  function handlePillClick(idx: number) {
    setLockedIdx((prev) => (prev === idx ? null : idx));
    setActiveIdx(null);
  }

  return (
    <Card className="relative rounded-lg" size="sm">
      <CardContent className="flex flex-1 flex-col">
        <p className="text-sm font-semibold">{title}</p>
        <div className="min-w-0 overflow-hidden pt-2">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            role="img"
            aria-label={`${title} distribution`}
            className="w-full"
          >
            <Group left={marginLeft} top={marginTop}>
              {/* Y-axis grid + ticks */}
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

              {/* X-axis baseline */}
              <line
                x1={0}
                x2={innerWidth}
                y1={innerHeight}
                y2={innerHeight}
                stroke="var(--border)"
                strokeWidth={1}
              />

              {/* Column hover highlight — rendered behind the bars */}
              {hoveredYear !== null && (
                <rect
                  x={(xScale(hoveredYear) ?? 0) - xScale.step() * 0.125}
                  y={0}
                  width={xScale.step()}
                  height={innerHeight}
                  fill="var(--primary)"
                  fillOpacity={0.08}
                  rx={3}
                  pointerEvents="none"
                />
              )}

              {/* Stacked bars — pointer-events handled by overlay below */}
              <BarStack<SerotypeYear, string>
                data={data.years}
                keys={data.serovars}
                x={(d) => d.year}
                xScale={xScale}
                yScale={yScale}
                color={colorScale}
              >
                {(barStacks) =>
                  barStacks.map((barStack) => {
                    const svIdx = barStack.index;
                    const isActive = currentActive === svIdx;
                    const isDimmed = currentActive !== null && !isActive;

                    return barStack.bars.map((bar) => {
                      const count = bar.bar.data[barStack.key] ?? 0;
                      const label = `${barStack.key}: ${numberFormatter.format(count)}`;
                      return (
                        <rect
                          key={`bar-${barStack.index}-${bar.index}`}
                          x={bar.x}
                          y={bar.y}
                          height={Math.max(bar.height, 0)}
                          width={bar.width}
                          fill={bar.color}
                          rx={barStack.index === barStacks.length - 1 ? 2 : 0}
                          aria-label={label}
                          pointerEvents="none"
                          style={{
                            opacity: isDimmed ? 0.12 : 1,
                            transition: "opacity 160ms ease",
                          }}
                        >
                          <title>{label}</title>
                        </rect>
                      );
                    });
                  })
                }
              </BarStack>

              {/*
               * Transparent overlay — covers the full inner chart area.
               * Detects mouse position to determine the nearest year column,
               * then shows the column highlight and tooltip for the whole area
               * (not just where bars exist). Click locks/unlocks a serovar.
               */}
              <rect
                data-testid="chart-overlay"
                x={0}
                y={0}
                width={innerWidth}
                height={innerHeight}
                fill="transparent"
                onMouseMove={(event) => {
                  const svgEl = svgRef.current;
                  if (!svgEl) return;
                  const rect = svgEl.getBoundingClientRect();
                  const scaleX = rect.width > 0 ? chartWidth / rect.width : 1;
                  const mouseX =
                    (event.clientX - rect.left) * scaleX - marginLeft;
                  // Find the year whose band center is closest to mouseX.
                  // scaleBand bands don't start at multiples of step (paddingOuter
                  // shifts the first band), so nearest-center is the correct approach.
                  const halfBand = xScale.bandwidth() / 2;
                  let closestIdx = 0;
                  let closestDist = Infinity;
                  data.years.forEach((y, idx) => {
                    const center = (xScale(y.year) ?? 0) + halfBand;
                    const dist = Math.abs(mouseX - center);
                    if (dist < closestDist) {
                      closestDist = dist;
                      closestIdx = idx;
                    }
                  });
                  const yearEntry = data.years[closestIdx];
                  if (!yearEntry) return;
                  setHoveredYear(yearEntry.year);
                  showTooltip({
                    tooltipData: {
                      year: yearEntry.year,
                      rows: data.serovars
                        .map((sv) => ({
                          serovar: sv,
                          count: yearEntry[sv] ?? 0,
                          color: colorScale(sv),
                        }))
                        .filter((r) => r.count > 0)
                        .sort((a, b) => b.count - a.count),
                    },
                    tooltipLeft: event.clientX,
                    tooltipTop: event.clientY,
                  });
                }}
                onMouseLeave={() => {
                  setHoveredYear(null);
                  hideTooltip();
                }}
                onClick={() => {
                  // Click in empty space releases any serovar lock
                  setLockedIdx(null);
                  setActiveIdx(null);
                }}
              />

              {/* X-axis year labels */}
              {data.years.map((d) => {
                const x = (xScale(d.year) ?? 0) + xScale.bandwidth() / 2;
                return (
                  <text
                    key={`xlabel-${d.year}`}
                    x={x}
                    y={innerHeight + 18}
                    textAnchor="middle"
                    fontSize={11}
                    className="fill-muted-foreground tabular-nums"
                  >
                    {d.year}
                  </text>
                );
              })}
            </Group>
          </svg>
        </div>

        {/* Legend pills */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {data.serovars.map((sv, idx) => {
            const isActive = currentActive === idx;
            const isDimmed = currentActive !== null && !isActive;
            return (
              <button
                key={sv}
                type="button"
                data-active={isActive ? "true" : undefined}
                aria-pressed={lockedIdx === idx}
                aria-label={sv}
                className={cn(
                  "flex cursor-default items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] transition-colors",
                  isDimmed
                    ? "border-border text-muted-foreground opacity-30"
                    : isActive
                      ? "text-foreground"
                      : "border-border text-muted-foreground",
                )}
                style={
                  isActive
                    ? {
                        borderColor: colorScale(sv),
                        backgroundColor: `color-mix(in srgb, ${colorScale(sv)} 12%, transparent)`,
                      }
                    : undefined
                }
                onMouseEnter={() => handlePillMouseEnter(idx)}
                onMouseLeave={handlePillMouseLeave}
                onClick={() => handlePillClick(idx)}
              >
                <span
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: colorScale(sv) }}
                  aria-hidden="true"
                />
                {sv}
              </button>
            );
          })}
        </div>
      </CardContent>

      {/* Tooltip — shows all serovars for the hovered year */}
      {tooltipData && (
        <div
          role="status"
          className="bg-popover text-popover-foreground pointer-events-none fixed rounded-md border px-3 py-2 text-xs shadow-md"
          style={{
            left: (tooltipLeft ?? 0) + tooltipOffsetX,
            top: (tooltipTop ?? 0) + tooltipOffsetY,
          }}
        >
          <p className="text-foreground mb-1.5 font-semibold">
            {tooltipData.year}
          </p>
          <div className="flex flex-col gap-1">
            {tooltipData.rows.map(({ serovar, count, color }) => (
              <div key={serovar} className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ background: color }}
                />
                <span className="text-muted-foreground flex-1">{serovar}</span>
                <span className="tabular-nums font-semibold">
                  {numberFormatter.format(count)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
