"use client";

import { useRef, useState } from "react";

import { scaleOrdinal } from "@visx/scale";
import { useTooltip } from "@visx/tooltip";

import { facetDisplayLabel } from "@/components/organisms/facet-label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  chartColors as sharedChartColors,
  chartTooltipStyle,
  donutFallbackColor,
} from "@/lib/services/organisms/chart-utils";
import { numberFormatter } from "@/lib/services/organisms/utils";

import { ChartLegendPill } from "./_shared/chart-legend-pill";

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

// Donut uses up to 10 distinct accents plus a muted color for the "Others" bucket.
// chart-1..5 are brand-derived per theme (primary/secondary/accent/violet/coral);
// chart-6..10 are shared fills from globals.css.
// Sequence (dxkb): navy(267)→amber(37)→teal(195)→coral(15)→gold(85)→pink(340)→green(140)→violet(310)→orange(50)→cyan-green(175)→gray
const donutPalette = [
  sharedChartColors[0], // chart-1:  primary      h≈267
  sharedChartColors[1], // chart-2:  secondary    h≈37
  sharedChartColors[5], // chart-6:  teal         h=195
  sharedChartColors[4], // chart-5:  coral        h≈15
  sharedChartColors[2], // chart-3:  gold         h≈85
  sharedChartColors[8], // chart-9:  pink         h=340
  sharedChartColors[7], // chart-8:  green        h=140
  sharedChartColors[3], // chart-4:  violet       h≈310
  sharedChartColors[6], // chart-7:  orange       h=50
  sharedChartColors[9], // chart-10: cyan-green   h=175
  donutFallbackColor,
];

const chartSize = 160;
const chartCenter = chartSize / 2;
const outerRadius = 66;
const innerRadius = 38;
const popDistance = 4;
const tooltipEstimatedWidth = 160;
const tooltipEstimatedHeight = 32;
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

  if (positive.length <= 10) return positive;

  const top = positive.slice(0, 9);
  const otherValue = positive
    .slice(9)
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
  const sweep = endAngle - startAngle;
  const f = (n: number) => Math.round(n * 1000) / 1000;

  // Full-circle slice (single positive datum): SVG arc with identical start/end
  // points renders nothing. Build the ring as two semicircles using even-odd fill.
  if (sweep >= Math.PI * 2 - 1e-6) {
    return [
      `M ${f(outerR)} 0`,
      `A ${outerR} ${outerR} 0 1 1 ${f(-outerR)} 0`,
      `A ${outerR} ${outerR} 0 1 1 ${f(outerR)} 0`,
      "Z",
      `M ${f(innerR)} 0`,
      `A ${innerR} ${innerR} 0 1 0 ${f(-innerR)} 0`,
      `A ${innerR} ${innerR} 0 1 0 ${f(innerR)} 0`,
      "Z",
    ].join(" ");
  }

  const pt = (radius: number, angle: number) => ({
    x: radius * Math.sin(angle),
    y: -radius * Math.cos(angle),
  });

  const outerStart = pt(outerR, startAngle);
  const outerEnd   = pt(outerR, endAngle);
  const innerEnd   = pt(innerR, endAngle);
  const innerStart = pt(innerR, startAngle);

  const large = sweep > Math.PI ? 1 : 0;
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
    range: donutPalette,
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

  const showTooltipForArc = (arc: ArcDatum, clientX: number, clientY: number) => {
    setActiveId(arc.slice.id);
    showTooltip({
      tooltipData: {
        label: arc.slice.label,
        value: arc.slice.value,
        pct: Math.round((arc.slice.value / total) * 100),
      },
      tooltipLeft: clientX,
      tooltipTop: clientY,
    });
  };

  const handleOverlayMouseMove = (
    event: React.MouseEvent<SVGCircleElement>,
  ) => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const rect = svgEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const svgX = ((event.clientX - rect.left) / rect.width) * chartSize - chartCenter;
    const svgY = ((event.clientY - rect.top) / rect.height) * chartSize - chartCenter;
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
        showTooltipForArc(arc, event.clientX, event.clientY);
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
                          stroke={arc.color}
                          strokeWidth={0.5}
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
                  <ChartLegendPill
                    key={arc.slice.id}
                    label={arc.slice.label}
                    color={arc.color}
                    active={activeId === arc.slice.id}
                    variant="row"
                    ariaLabel={`${arc.slice.label}: ${numberFormatter.format(arc.slice.value)}`}
                    onActivate={() => setActiveId(arc.slice.id)}
                    onDeactivate={() => setActiveId(null)}
                    onFocus={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect();
                      showTooltipForArc(arc, rect.right, rect.top);
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate text-left">
                      {arc.slice.label}
                    </span>
                    <span className="tabular-nums">
                      {numberFormatter.format(arc.slice.value)}
                    </span>
                  </ChartLegendPill>
                ))}
              </div>
            ) : (
              <div
                className="flex flex-wrap justify-center gap-1.5"
                style={{ animation: "donut-legend-up 0.4s 0.4s ease-out both" }}
              >
                {arcData.map((arc) => (
                  <ChartLegendPill
                    key={arc.slice.id}
                    label={arc.slice.label}
                    color={arc.color}
                    active={activeId === arc.slice.id}
                    ariaLabel={`${arc.slice.label}: ${numberFormatter.format(arc.slice.value)}`}
                    onActivate={() => setActiveId(arc.slice.id)}
                    onDeactivate={() => setActiveId(null)}
                    onFocus={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect();
                      showTooltipForArc(arc, rect.right, rect.top);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
      {tooltipData && (
        <div
          role="status"
          className="bg-popover text-popover-foreground pointer-events-none fixed z-50 rounded-md border px-2 py-1 text-xs shadow-md"
          style={chartTooltipStyle(
            tooltipLeft ?? 0,
            tooltipTop ?? 0,
            tooltipEstimatedWidth,
            tooltipEstimatedHeight,
          )}
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
