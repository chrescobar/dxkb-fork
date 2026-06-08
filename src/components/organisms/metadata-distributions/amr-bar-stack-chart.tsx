"use client";

import { useMemo, useRef, useState } from "react";

import { Group } from "@visx/group";
import { scaleBand, scaleLinear, scaleOrdinal } from "@visx/scale";
import { BarStack } from "@visx/shape";
import { useTooltip } from "@visx/tooltip";

import { Card, CardContent } from "@/components/ui/card";
import type {
  AmrAntibioticRow,
  AmrDistributionData,
  AmrPhenotype,
} from "@/lib/services/organisms/types";
import { chartColors, chartTooltipStyle } from "@/lib/services/organisms/chart-utils";
import { numberFormatter } from "@/lib/services/organisms/utils";

import { ChartLegendPill } from "./_shared/chart-legend-pill";
import {
  amrChartWidth,
  amrInnerWidth,
  chartMarginLeft,
  chartMarginTop,
  stackedChartHeight,
  stackedInnerHeight,
} from "./_shared/chart-dimensions";
import { nearestBandIndex } from "./_shared/use-svg-band-pointer";
import { YAxisTicks } from "./_shared/y-axis-ticks";

interface AmrBarStackChartProps {
  title: string;
  data: AmrDistributionData;
}

interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

interface ToggleRowProps<T extends string> {
  label: string;
  options: readonly ToggleOption<T>[];
  value: T;
  onChange: (next: T) => void;
}

function ToggleRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: ToggleRowProps<T>) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{label}</span>
      <div
        role="group"
        aria-label={label}
        className="inline-flex overflow-hidden rounded-md border"
      >
        {options.map((opt) => {
          const pressed = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={pressed}
              onClick={() => onChange(opt.value)}
              className={
                "px-2 py-0.5 text-xs transition-colors " +
                (pressed
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:text-foreground")
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface Highlight {
  idx: number;
  locked: boolean;
}

interface ColumnTooltipRow {
  phenotype: AmrPhenotype;
  count: number;
  color: string;
}

interface ColumnTooltipData {
  antibiotic: string;
  rows: ColumnTooltipRow[];
}

const phenotypes: readonly AmrPhenotype[] = [
  "Resistant",
  "Susceptible",
  "Intermediate",
];

const tooltipOffsetX = 16;
const tooltipOffsetY = 16;

export function AmrBarStackChart({ title, data }: AmrBarStackChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [hoveredAntibiotic, setHoveredAntibiotic] = useState<string | null>(
    null,
  );
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<ColumnTooltipData>();

  const [scale, setScale] = useState<"counts" | "percent">("counts");
  const [order, setOrder] = useState<"name" | "count">("count");

  const sortedRows = useMemo(() => {
    if (order === "name") {
      return [...data.antibiotics].sort((a, b) =>
        a.antibiotic.localeCompare(b.antibiotic),
      );
    }
    return data.antibiotics;
  }, [data.antibiotics, order]);

  const displayRows = useMemo<AmrAntibioticRow[]>(() => {
    if (scale === "counts") return sortedRows;
    return sortedRows.map((row) => {
      if (row.total === 0) return row;
      const pct = (n: number) =>
        Math.round((n / row.total) * 1000) / 10; // 1 decimal place
      return {
        antibiotic: row.antibiotic,
        Resistant: pct(row.Resistant),
        Susceptible: pct(row.Susceptible),
        Intermediate: pct(row.Intermediate),
        total: 100,
      };
    });
  }, [sortedRows, scale]);

  const yMax = useMemo(() => {
    if (scale === "percent") return 100;
    return Math.max(...sortedRows.map((r) => r.total), 1);
  }, [sortedRows, scale]);

  if (data.antibiotics.length === 0) {
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

  const activeIdx = highlight?.idx ?? null;

  const xScale = scaleBand<string>({
    domain: sortedRows.map((r) => r.antibiotic),
    range: [0, amrInnerWidth],
    padding: 0.25,
  });

  const yScale = scaleLinear<number>({
    domain: [0, yMax],
    range: [stackedInnerHeight, 0],
    nice: true,
  });

  const colorScale = scaleOrdinal<AmrPhenotype, string>({
    domain: [...phenotypes],
    range: chartColors.slice(0, phenotypes.length),
  });

  const yTicks =
    scale === "percent" ? [0, 25, 50, 75, 100] : yScale.ticks(4);

  function activatePill(idx: number) {
    if (highlight?.locked) return;
    setHighlight({ idx, locked: false });
  }

  function deactivatePill() {
    if (highlight?.locked) return;
    setHighlight(null);
  }

  function togglePillLock(idx: number) {
    setHighlight((prev) =>
      prev?.locked && prev.idx === idx ? null : { idx, locked: true },
    );
  }

  return (
    <Card className="relative rounded-lg" size="sm">
      <CardContent className="flex flex-1 flex-col">
        <p className="text-sm font-semibold">{title}</p>
        <nav className="mt-2 flex flex-wrap items-center gap-4 text-xs">
          <ToggleRow
            label="Scale"
            options={[
              { value: "counts", label: "Counts" },
              { value: "percent", label: "Percent" },
            ]}
            value={scale}
            onChange={setScale}
          />
          <ToggleRow
            label="Order"
            options={[
              { value: "count", label: "Count" },
              { value: "name", label: "Name" },
            ]}
            value={order}
            onChange={setOrder}
          />
        </nav>
        <div className="min-w-0 overflow-hidden pt-2">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${amrChartWidth} ${stackedChartHeight}`}
            role="img"
            aria-label={`${title} distribution`}
            className="w-full"
          >
            <Group left={chartMarginLeft} top={chartMarginTop}>
              <YAxisTicks ticks={yTicks} yScale={yScale} innerWidth={amrInnerWidth} />

              <line
                x1={0}
                x2={amrInnerWidth}
                y1={stackedInnerHeight}
                y2={stackedInnerHeight}
                stroke="var(--border)"
                strokeWidth={1}
              />

              {hoveredAntibiotic !== null && (
                <rect
                  x={(xScale(hoveredAntibiotic) ?? 0) - xScale.step() * 0.125}
                  y={0}
                  width={xScale.step()}
                  height={stackedInnerHeight}
                  fill="var(--primary)"
                  fillOpacity={0.08}
                  rx={3}
                  pointerEvents="none"
                />
              )}

              <BarStack<AmrAntibioticRow, AmrPhenotype>
                data={displayRows}
                keys={[...phenotypes]}
                x={(d) => d.antibiotic}
                xScale={xScale}
                yScale={yScale}
                color={colorScale}
              >
                {(barStacks) =>
                  barStacks.map((barStack) => {
                    const phenoIdx = barStack.index;
                    const isActive = activeIdx === phenoIdx;
                    const isDimmed = activeIdx !== null && !isActive;

                    return barStack.bars.map((bar) => {
                      const count = bar.bar.data[barStack.key];
                      const label =
                        scale === "percent"
                          ? `${barStack.key}: ${count}%`
                          : `${barStack.key}: ${numberFormatter.format(count)}`;
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

              <rect
                data-testid="amr-chart-overlay"
                x={0}
                y={0}
                width={amrInnerWidth}
                height={stackedInnerHeight}
                fill="transparent"
                onMouseMove={(event) => {
                  const idx = nearestBandIndex(
                    event,
                    svgRef,
                    xScale,
                    sortedRows.map((r) => r.antibiotic),
                    chartMarginLeft,
                    amrChartWidth,
                  );
                  if (idx === null) return;
                  const row = sortedRows[idx];
                  if (!row) return;
                  setHoveredAntibiotic(row.antibiotic);
                  showTooltip({
                    tooltipData: {
                      antibiotic: row.antibiotic,
                      rows: phenotypes
                        .map((p) => ({
                          phenotype: p,
                          count: displayRows[idx]?.[p] ?? 0,
                          color: colorScale(p),
                        }))
                        .filter((r) => r.count > 0)
                        .sort((a, b) => b.count - a.count),
                    },
                    tooltipLeft: event.clientX,
                    tooltipTop: event.clientY,
                  });
                }}
                onMouseLeave={() => {
                  setHoveredAntibiotic(null);
                  hideTooltip();
                }}
                onClick={() => setHighlight(null)}
              />

              {sortedRows.map((r) => {
                const x = (xScale(r.antibiotic) ?? 0) + xScale.bandwidth() / 2;
                return (
                  <text
                    key={`xlabel-${r.antibiotic}`}
                    transform={`translate(${x},${stackedInnerHeight + 6}) rotate(-45)`}
                    textAnchor="end"
                    fontSize={11}
                    className="fill-muted-foreground"
                  >
                    {r.antibiotic}
                  </text>
                );
              })}
            </Group>
          </svg>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {phenotypes.map((p, idx) => {
            const isActive = activeIdx === idx;
            const isDimmed = activeIdx !== null && !isActive;
            return (
              <ChartLegendPill
                key={p}
                label={p}
                color={colorScale(p)}
                active={isActive}
                dimmed={isDimmed}
                ariaPressed={highlight?.locked === true && highlight.idx === idx}
                onActivate={() => activatePill(idx)}
                onDeactivate={deactivatePill}
                onClick={() => togglePillLock(idx)}
              />
            );
          })}
        </div>
      </CardContent>

      {tooltipData && (
        <div
          role="status"
          className="bg-popover text-popover-foreground pointer-events-none fixed z-50 rounded-md border px-3 py-2 text-xs shadow-md"
          style={chartTooltipStyle(
            tooltipLeft ?? 0,
            tooltipTop ?? 0,
            180,
            20 + tooltipData.rows.length * 22,
            tooltipOffsetX,
            tooltipOffsetY,
          )}
        >
          <p className="text-foreground mb-1.5 font-semibold">
            {tooltipData.antibiotic}
          </p>
          <div className="flex flex-col gap-1">
            {tooltipData.rows.map(({ phenotype, count, color }) => (
              <div key={phenotype} className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ background: color }}
                />
                <span className="text-muted-foreground flex-1">{phenotype}</span>
                <span className="tabular-nums font-semibold">
                  {scale === "percent"
                    ? `${count}%`
                    : numberFormatter.format(count)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
