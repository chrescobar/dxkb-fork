"use client";

import { useRef, useState } from "react";

import { scaleOrdinal } from "@visx/scale";
import { useTooltip } from "@visx/tooltip";

import { facetDisplayLabel } from "@/components/organisms/facet-label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { numberFormatter } from "@/lib/services/organisms/utils";

interface DonutDatum {
  label: string;
  value: number;
}

interface DonutChartDatum extends DonutDatum {
  id: string;
}

interface DonutChartProps {
  title: string;
  data: DonutDatum[];
  layout?: "bottom" | "side";
}

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

const chartSize = 160;
const chartCenter = chartSize / 2;
const outerRadius = 66;
const innerRadius = 38;
const popDistance = 4;
const tooltipOffsetX = 12;
const tooltipOffsetY = -36;
const aggregateLabel = "Others";
const fallbackAggregateLabel = "Other values";

function uniqueAggregateLabel(labels: readonly string[]): string {
  const existingLabels = new Set(labels);
  if (!existingLabels.has(aggregateLabel)) return aggregateLabel;
  if (!existingLabels.has(fallbackAggregateLabel))
    return fallbackAggregateLabel;
  let suffix = 2;
  while (existingLabels.has(`${fallbackAggregateLabel} ${suffix}`)) {
    suffix += 1;
  }
  return `${fallbackAggregateLabel} ${suffix}`;
}

function chartData(data: DonutDatum[]): DonutChartDatum[] {
  const positive = data
    .filter((datum) => datum.value > 0)
    .map((datum, index) => ({
      ...datum,
      id: `bucket-${index}`,
      label: facetDisplayLabel(datum.label),
    }));

  if (positive.length <= 5) return positive;

  const top = positive.slice(0, 4);
  const otherValue = positive
    .slice(4)
    .reduce((sum, datum) => sum + datum.value, 0);

  return [
    ...top,
    {
      id: "aggregate-other",
      label: uniqueAggregateLabel(top.map((datum) => datum.label)),
      value: otherValue,
    },
  ];
}

// Standard donut arc path. Paths are centered at (0,0); the parent <g> handles
// translation to the chart center.
function arcPath(
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const pt = (radius: number, angle: number) => ({
    x: radius * Math.sin(angle),
    y: -radius * Math.cos(angle),
  });

  const outerStart = pt(outerR, startAngle);
  const outerEnd   = pt(outerR, endAngle);
  const innerEnd   = pt(innerR, endAngle);
  const innerStart = pt(innerR, startAngle);

  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  const f = (n: number) => Math.round(n * 1000) / 1000;
  const p = ({ x, y }: { x: number; y: number }) => `${f(x)} ${f(y)}`;

  return [
    `M ${p(outerStart)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${p(outerEnd)}`,
    `L ${p(innerEnd)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${p(innerStart)}`,
    "Z",
  ].join(" ");
}

interface ArcDatum {
  slice: DonutChartDatum;
  startAngle: number;
  endAngle: number;
  pathD: string;
  popX: number;
  popY: number;
  color: string;
}

function buildArcData(
  slices: DonutChartDatum[],
  getColor: (id: string) => string,
): ArcDatum[] {
  const total = slices.reduce((sum, d) => sum + d.value, 0);
  let angle = -Math.PI / 2;

  return slices.map((slice) => {
    const full = (slice.value / total) * Math.PI * 2;
    const startAngle = angle;
    const endAngle = angle + full;
    const midAngle = (startAngle + endAngle) / 2;
    angle += full;

    return {
      slice,
      startAngle,
      endAngle,
      pathD: arcPath(innerRadius, outerRadius, startAngle, endAngle),
      popX: Math.sin(midAngle) * popDistance,
      popY: -Math.cos(midAngle) * popDistance,
      color: getColor(slice.id),
    };
  });
}

export function DonutChart({ title, data, layout = "bottom" }: DonutChartProps) {
  const slices = chartData(data);
  const colorScale = scaleOrdinal<string, string>({
    domain: slices.map((datum) => datum.id),
    range: chartColors,
  });
  const arcData = buildArcData(slices, (id) => colorScale(id));
  const total = slices.reduce((sum, d) => sum + d.value, 0);

  const svgRef = useRef<SVGSVGElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<DonutDatum & { pct: number }>();

  const deactivate = () => {
    setActiveId(null);
    hideTooltip();
  };

  const handleOverlayMouseMove = (
    event: React.MouseEvent<SVGCircleElement>,
  ) => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const rect = svgEl.getBoundingClientRect();
    const svgX =
      ((event.clientX - rect.left) / rect.width) * chartSize - chartCenter;
    const svgY =
      ((event.clientY - rect.top) / rect.height) * chartSize - chartCenter;
    const dist = Math.sqrt(svgX * svgX + svgY * svgY);

    // Only activate within the ring — inner hole and outside edge are dead zones
    if (dist < innerRadius || dist > outerRadius) {
      deactivate();
      return;
    }

    const angle = Math.atan2(svgX, -svgY); // angle from 12 o'clock, clockwise
    for (const arc of arcData) {
      let a = angle;
      if (a < arc.startAngle) a += Math.PI * 2;
      if (a >= arc.startAngle && a <= arc.endAngle) {
        setActiveId(arc.slice.id);
        showTooltip({
          tooltipData: {
            label: arc.slice.label,
            value: arc.slice.value,
            pct: Math.round((arc.slice.value / total) * 100),
          },
          tooltipLeft: event.clientX,
          tooltipTop: event.clientY,
        });
        return;
      }
    }
    // Cursor is in a gap — keep current active slice without flickering
    if (tooltipData) {
      showTooltip({
        tooltipData,
        tooltipLeft: event.clientX,
        tooltipTop: event.clientY,
      });
    }
  };

  return (
    <Card className="relative rounded-lg" size="sm">
      <CardContent className="flex flex-1 flex-col">
        <p className="text-sm font-semibold">{title}</p>
        {slices.length === 0 ? (
          <p className="text-muted-foreground mt-1 text-sm">
            No distribution data was returned.
          </p>
        ) : (
          <div
            className={cn(
              "flex flex-1 gap-3 pt-2",
              layout === "side"
                ? "min-h-0 flex-row items-stretch"
                : "flex-col items-center justify-center",
            )}
          >
            {/*
             * Side layout: SVG takes half the card width and the full available
             * height. preserveAspectRatio="xMidYMid meet" (SVG default) renders
             * the donut as large as possible within that rectangle — no wrapper
             * div needed, no fixed cap that prevents growth on wide monitors.
             */}
            <svg
              ref={svgRef}
              viewBox={`0 0 ${chartSize} ${chartSize}`}
              role="img"
              aria-label={`${title} distribution`}
              className={cn(
                "shrink-0",
                layout === "side" ? "h-full w-1/2" : "w-full max-w-40",
              )}
              style={{ overflow: "visible" }}
            >
              <g transform={`translate(${chartCenter},${chartCenter})`}>
                {arcData.map((arc, index) => {
                  const isActive = activeId === arc.slice.id;
                  const isDimmed = activeId !== null && !isActive;
                  const accessibleLabel = `${arc.slice.label}: ${numberFormatter.format(arc.slice.value)}`;

                  return (
                    <g
                      key={arc.slice.id}
                      style={{
                        transform: isActive
                          ? `translate(${arc.popX}px, ${arc.popY}px)`
                          : undefined,
                        transition: "transform 180ms ease-out",
                      }}
                    >
                      {/*
                       * Inner <g> owns the entrance scale animation.
                       * Keeping it separate from the pop translate <g> above avoids
                       * the CSS animation overriding the inline transform on hover.
                       */}
                      <g
                        style={{
                          transformOrigin: "0 0",
                          animation: `donut-slice-in 0.38s ease-out ${index * 0.07}s both`,
                        }}
                      >
                        <path
                          suppressHydrationWarning
                          d={arc.pathD}
                          fill={arc.color}
                          aria-label={accessibleLabel}
                          style={{
                            opacity: isDimmed ? 0.2 : 1,
                            transition: "opacity 160ms ease",
                          }}
                        >
                          <title>{accessibleLabel}</title>
                        </path>
                      </g>
                    </g>
                  );
                })}
                {/*
                 * Single transparent overlay intercepts all mouse events.
                 * Angle + distance math in onMouseMove eliminates gap/hole flicker.
                 */}
                <circle
                  data-testid="chart-overlay"
                  r={outerRadius}
                  fill="transparent"
                  onMouseMove={handleOverlayMouseMove}
                  onMouseLeave={deactivate}
                />
              </g>
            </svg>

            {layout === "side" ? (
              <div
                className="flex min-w-0 flex-1 flex-col justify-center gap-0.5"
                style={{ animation: "donut-legend-up 0.4s 0.4s ease-out both" }}
              >
                {arcData.map((arc) => (
                  <button
                    key={arc.slice.id}
                    type="button"
                    aria-label={`${arc.slice.label}: ${numberFormatter.format(arc.slice.value)}`}
                    className={cn(
                      "flex w-full cursor-default items-center gap-1.5 rounded px-1.5 py-0.5 text-[10px] transition-colors",
                      activeId === arc.slice.id
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                    style={
                      activeId === arc.slice.id
                        ? {
                            backgroundColor: `color-mix(in srgb, ${arc.color} 12%, transparent)`,
                          }
                        : undefined
                    }
                    onMouseEnter={() => setActiveId(arc.slice.id)}
                    onMouseLeave={() => setActiveId(null)}
                    onFocus={() => setActiveId(arc.slice.id)}
                    onBlur={() => setActiveId(null)}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: arc.color }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-left">
                      {arc.slice.label}
                    </span>
                    <span className="tabular-nums">
                      {numberFormatter.format(arc.slice.value)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div
                className="flex flex-wrap justify-center gap-1.5"
                style={{ animation: "donut-legend-up 0.4s 0.4s ease-out both" }}
              >
                {arcData.map((arc) => (
                  <button
                    key={arc.slice.id}
                    type="button"
                    aria-label={`${arc.slice.label}: ${numberFormatter.format(arc.slice.value)}`}
                    className={cn(
                      "flex cursor-default items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] transition-colors",
                      activeId === arc.slice.id
                        ? "text-foreground"
                        : "border-border text-muted-foreground",
                    )}
                    style={
                      activeId === arc.slice.id
                        ? {
                            borderColor: arc.color,
                            backgroundColor: `color-mix(in srgb, ${arc.color} 12%, transparent)`,
                          }
                        : undefined
                    }
                    onMouseEnter={() => setActiveId(arc.slice.id)}
                    onMouseLeave={() => setActiveId(null)}
                    onFocus={() => setActiveId(arc.slice.id)}
                    onBlur={() => setActiveId(null)}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: arc.color }}
                      aria-hidden="true"
                    />
                    {arc.slice.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
      {tooltipData && (
        <div
          role="status"
          className="bg-popover text-popover-foreground pointer-events-none fixed rounded-md border px-2 py-1 text-xs shadow-md"
          style={{
            left: (tooltipLeft ?? 0) + tooltipOffsetX,
            top: (tooltipTop ?? 0) + tooltipOffsetY,
          }}
        >
          {tooltipData.label}: {numberFormatter.format(tooltipData.value)}
          <span className="text-muted-foreground ml-1">
            ({tooltipData.pct}%)
          </span>
        </div>
      )}
    </Card>
  );
}
