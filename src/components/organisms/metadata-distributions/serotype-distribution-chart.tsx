"use client";

import { useState } from "react";

import { Group } from "@visx/group";
import { scaleBand, scaleLinear, scaleOrdinal } from "@visx/scale";
import { BarStack } from "@visx/shape";
import { useTooltip } from "@visx/tooltip";

import { Card, CardContent } from "@/components/ui/card";
import type { SerotypeDistributionData, SerotypeYear } from "@/lib/services/organisms/types";
import { numberFormatter } from "@/lib/services/organisms/utils";
import { cn } from "@/lib/utils";

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
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [lockedIdx, setLockedIdx] = useState<number | null>(null);
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<{ serovar: string; year: number; count: number; pct: number }>();

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

              {/* Stacked bars */}
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
                      const yearTotal = data.serovars.reduce(
                        (s, sv) => s + (bar.bar.data[sv] ?? 0),
                        0,
                      );
                      const count = bar.bar.data[barStack.key] ?? 0;
                      const pct =
                        yearTotal > 0
                          ? Math.round((count / yearTotal) * 100)
                          : 0;
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
                          style={{
                            opacity: isDimmed ? 0.12 : 1,
                            transition: "opacity 160ms ease",
                          }}
                          onMouseEnter={(event) => {
                            if (lockedIdx === null) setActiveIdx(svIdx);
                            showTooltip({
                              tooltipData: {
                                serovar: barStack.key,
                                year: bar.bar.data.year,
                                count,
                                pct,
                              },
                              tooltipLeft: event.clientX,
                              tooltipTop: event.clientY,
                            });
                          }}
                          onMouseMove={(event) => {
                            showTooltip({
                              tooltipData: {
                                serovar: barStack.key,
                                year: bar.bar.data.year,
                                count,
                                pct,
                              },
                              tooltipLeft: event.clientX,
                              tooltipTop: event.clientY,
                            });
                          }}
                          onMouseLeave={() => {
                            if (lockedIdx === null) setActiveIdx(null);
                            hideTooltip();
                          }}
                          onClick={() => {
                            setLockedIdx((prev) =>
                              prev === svIdx ? null : svIdx,
                            );
                            setActiveIdx(null);
                          }}
                        >
                          <title>{label}</title>
                        </rect>
                      );
                    });
                  })
                }
              </BarStack>

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

      {/* Tooltip */}
      {tooltipData && (
        <div
          role="status"
          className="bg-popover text-popover-foreground pointer-events-none fixed rounded-md border px-2 py-1 text-xs shadow-md"
          style={{
            left: (tooltipLeft ?? 0) + tooltipOffsetX,
            top: (tooltipTop ?? 0) + tooltipOffsetY,
          }}
        >
          <span
            className="mr-1 inline-block h-2 w-2 rounded-full"
            style={{ background: colorScale(tooltipData.serovar) }}
          />
          {tooltipData.serovar}
          <span className="text-muted-foreground ml-1">
            {tooltipData.year} · {numberFormatter.format(tooltipData.count)}{" "}
            ({tooltipData.pct}%)
          </span>
        </div>
      )}
    </Card>
  );
}
