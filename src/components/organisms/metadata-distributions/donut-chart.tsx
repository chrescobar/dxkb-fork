"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { animate } from "framer-motion";

import { scaleOrdinal } from "@visx/scale";
import { useTooltip } from "@visx/tooltip";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { facetDisplayLabel } from "@/components/organisms/facet-label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  chartColors as sharedChartColors,
  chartTooltipStyle,
  donutFallbackColor,
} from "@/lib/services/organisms/chart-utils";
import { numberFormatter } from "@/lib/services/organisms/utils";

import { ChartLegendPill } from "./_shared/chart-legend-pill";
import { ChartStatusMessage } from "./_shared/chart-status-message";

export interface DonutDatum {
  label: string;
  value: number;
}

interface DonutChartDatum extends DonutDatum {
  id: string;
}

export interface DonutChartTab {
  label: string;
  data: DonutDatum[];
}

interface DonutChartProps {
  title: string;
  data?: DonutDatum[];
  tabs?: DonutChartTab[];
  layout?: "bottom" | "side";
  errorMessage?: string;
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

interface AnimatedArcDatum extends ArcDatum {
  opacity: number;
}

function interpolateArcData(prev: AnimatedArcDatum[], target: ArcDatum[], t: number): AnimatedArcDatum[] {
  const result: AnimatedArcDatum[] = [];
  for (const toArc of target) {
    const fromArc = prev.find((a) => a.slice.id === toArc.slice.id);
    if (fromArc) {
      const s = fromArc.startAngle + (toArc.startAngle - fromArc.startAngle) * t;
      const e = fromArc.endAngle + (toArc.endAngle - fromArc.endAngle) * t;
      result.push({ ...toArc, startAngle: s, endAngle: e, pathD: e - s > 0.001 ? arcPath(innerRadius, outerRadius, s, e) : "M 0 0", opacity: 1 });
    } else {
      const mid = (toArc.startAngle + toArc.endAngle) / 2;
      const s = mid + (toArc.startAngle - mid) * t;
      const e = mid + (toArc.endAngle - mid) * t;
      result.push({ ...toArc, startAngle: s, endAngle: e, pathD: e - s > 0.001 ? arcPath(innerRadius, outerRadius, s, e) : "M 0 0", opacity: t });
    }
  }
  for (const fromArc of prev) {
    if (!target.find((a) => a.slice.id === fromArc.slice.id)) {
      const mid = (fromArc.startAngle + fromArc.endAngle) / 2;
      const s = fromArc.startAngle + (mid - fromArc.startAngle) * t;
      const e = fromArc.endAngle + (mid - fromArc.endAngle) * t;
      result.push({ ...fromArc, startAngle: s, endAngle: e, pathD: e - s > 0.001 ? arcPath(innerRadius, outerRadius, s, e) : "M 0 0", opacity: 1 - t });
    }
  }
  return result;
}

interface ArcInterp { id: string; fromStart: number; toStart: number; fromEnd: number; toEnd: number; fromOpacity: number; toOpacity: number; }

function buildInterpData(prev: AnimatedArcDatum[], target: ArcDatum[]): ArcInterp[] {
  const result: ArcInterp[] = [];
  for (const toArc of target) {
    const fromArc = prev.find((a) => a.slice.id === toArc.slice.id);
    if (fromArc) {
      result.push({ id: toArc.slice.id, fromStart: fromArc.startAngle, toStart: toArc.startAngle, fromEnd: fromArc.endAngle, toEnd: toArc.endAngle, fromOpacity: fromArc.opacity, toOpacity: 1 });
    } else {
      const mid = (toArc.startAngle + toArc.endAngle) / 2;
      result.push({ id: toArc.slice.id, fromStart: mid, toStart: toArc.startAngle, fromEnd: mid, toEnd: toArc.endAngle, fromOpacity: 0, toOpacity: 1 });
    }
  }
  for (const fromArc of prev) {
    if (!target.find((a) => a.slice.id === fromArc.slice.id)) {
      const mid = (fromArc.startAngle + fromArc.endAngle) / 2;
      result.push({ id: fromArc.slice.id, fromStart: fromArc.startAngle, toStart: mid, fromEnd: fromArc.endAngle, toEnd: mid, fromOpacity: fromArc.opacity, toOpacity: 0 });
    }
  }
  return result;
}

export function DonutChart({ title, data, tabs, layout = "bottom", errorMessage }: DonutChartProps) {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<string>>(new Set());

  const slices = useMemo(() => {
    const activeData: DonutDatum[] = tabs
      ? (tabs[activeTabIndex]?.data ?? [])
      : (data ?? []);
    return chartData(activeData);
  }, [tabs, activeTabIndex, data]);
  const colorScale = useMemo(
    () => scaleOrdinal<string, string>({ domain: slices.map((d) => d.id), range: donutPalette }),
    [slices],
  );
  const visibleSlices = useMemo(
    () => slices.filter((s) => !hiddenIds.has(s.id)),
    [slices, hiddenIds],
  );
  const arcData = useMemo(
    () => buildArcData(visibleSlices, (id) => colorScale(id)),
    [visibleSlices, colorScale],
  );
  const total = visibleSlices.reduce((sum, d) => sum + d.value, 0);

  const [displayedArcs, setDisplayedArcs] = useState<AnimatedArcDatum[]>([]);
  const prevArcsRef = useRef<AnimatedArcDatum[]>([]);
  const pathRefs = useRef(new Map<string, SVGPathElement>());
  const animRef = useRef<ReturnType<typeof animate> | null>(null);

  useEffect(() => {
    animRef.current?.stop();
    const prev = prevArcsRef.current;
    const target = arcData;
    const interp = buildInterpData(prev, target);
    setDisplayedArcs(interpolateArcData(prev, target, 0));
    let raf2: number;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        animRef.current = animate(0, 1, {
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
          onUpdate(t) {
            for (const arc of interp) {
              const el = pathRefs.current.get(arc.id);
              if (!el) continue;
              const s = arc.fromStart + (arc.toStart - arc.fromStart) * t;
              const e = arc.fromEnd + (arc.toEnd - arc.fromEnd) * t;
              el.setAttribute("d", e - s > 0.001 ? arcPath(innerRadius, outerRadius, s, e) : "M 0 0");
              el.style.opacity = String(arc.fromOpacity + (arc.toOpacity - arc.fromOpacity) * t);
            }
          },
          onComplete() {
            const final = target.map((a) => ({ ...a, opacity: 1 }));
            setDisplayedArcs(final);
            prevArcsRef.current = final;
          },
        });
      });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); animRef.current?.stop(); };
  }, [arcData]);

  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const activeId = hoveredId;
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<DonutDatum & { pct: number }>();

  const handleTabChange = (index: number) => {
    setActiveTabIndex(index);
    setHoveredId(null);
    setHiddenIds(new Set());
    hideTooltip();
  };

  const toggleSlice = (id: string) => {
    hideTooltip();
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setHoveredId(id); // keep cursor active immediately after unhiding
      } else {
        next.add(id);
        setHoveredId(null);
      }
      return next;
    });
  };

  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const check = () => {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    check();
    el.addEventListener("scroll", check);
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(check);
      ro.observe(el);
      return () => {
        ro.disconnect();
        el.removeEventListener("scroll", check);
      };
    }
    return () => el.removeEventListener("scroll", check);
  }, [tabs]);

  const scrollTabsBy = (delta: number) => {
    tabsScrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  const deactivateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activateHover = (id: string) => {
    if (deactivateTimer.current) {
      clearTimeout(deactivateTimer.current);
      deactivateTimer.current = null;
    }
    setHoveredId(id);
  };

  const deactivate = () => {
    deactivateTimer.current = setTimeout(() => {
      setHoveredId(null);
      hideTooltip();
    }, 40);
  };

  const showTooltipForArc = (arc: ArcDatum, clientX: number, clientY: number) => {
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
    if (!rect.width || !rect.height) return;
    // xMidYMid meet applies a single uniform scale; compute it from whichever
    // axis is the bottleneck and subtract the resulting letterbox offset before
    // mapping to SVG space.
    const uniformScale = Math.min(rect.width / chartSize, rect.height / chartSize);
    const letterboxX = (rect.width - chartSize * uniformScale) / 2;
    const letterboxY = (rect.height - chartSize * uniformScale) / 2;
    const svgX = (event.clientX - rect.left - letterboxX) / uniformScale - chartCenter;
    const svgY = (event.clientY - rect.top - letterboxY) / uniformScale - chartCenter;
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
        activateHover(arc.slice.id);
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
        <div className="flex items-start gap-2">
          <h3 className="text-sm font-semibold shrink-0 max-w-[60%] m-0">{title}</h3>
          {tabs && tabs.length > 1 && (
            <div className="bg-muted/50 ml-auto flex min-w-0 items-center gap-0.5 rounded-md p-0.5">
              {(() => {
                const scrollable = canScrollLeft || canScrollRight;
                return (
                  <>
                    <div
                      className={cn(
                        "shrink-0 overflow-hidden",
                        !scrollable
                          ? "hidden"
                          : "transition-[max-width,opacity] duration-300 ease-in-out",
                        scrollable && (canScrollLeft ? "max-w-6 opacity-100" : "max-w-0 opacity-0"),
                      )}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => scrollTabsBy(-80)}
                        aria-label="Scroll tabs left"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div
                      ref={tabsScrollRef}
                      className="flex min-w-0 flex-1 overflow-x-auto"
                      style={{ scrollbarWidth: "none" }}
                    >
                      <div className="flex flex-nowrap items-center gap-0.5">
                        {tabs.map((tab, i) => (
                          <Button
                            key={tab.label}
                            type="button"
                            variant={i === activeTabIndex ? "default" : "ghost"}
                            size="xs"
                            aria-pressed={i === activeTabIndex}
                            onClick={() => handleTabChange(i)}
                            className="shrink-0"
                          >
                            {tab.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "shrink-0 overflow-hidden",
                        !scrollable
                          ? "hidden"
                          : "transition-[max-width,opacity] duration-300 ease-in-out",
                        scrollable && (canScrollRight ? "max-w-6 opacity-100" : "max-w-0 opacity-0"),
                      )}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => scrollTabsBy(80)}
                        aria-label="Scroll tabs right"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
        {errorMessage || slices.length === 0 ? (
          <ChartStatusMessage errorMessage={errorMessage} />
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
                {displayedArcs.map((arc) => {
                  const isActive = activeId === arc.slice.id;
                  const accessibleLabel = `${arc.slice.label}: ${numberFormatter.format(arc.slice.value)}`;
                  return (
                    <g
                      key={arc.slice.id}
                      style={{
                        transform: isActive ? `translate(${arc.popX}px, ${arc.popY}px)` : undefined,
                        transition: "transform 180ms ease-out",
                      }}
                    >
                      <path
                        ref={(el) => { if (el) pathRefs.current.set(arc.slice.id, el); else pathRefs.current.delete(arc.slice.id); }}
                        suppressHydrationWarning
                        d={arc.pathD}
                        fill={arc.color}
                        stroke={arc.color}
                        strokeWidth={0.5}
                        aria-label={accessibleLabel}
                        style={{ opacity: arc.opacity }}
                      >
                        <title>{accessibleLabel}</title>
                      </path>
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
                {slices.map((slice) => {
                  const isHidden = hiddenIds.has(slice.id);
                  return (
                    <ChartLegendPill
                      key={slice.id}
                      label={slice.label}
                      color={colorScale(slice.id)}
                      active={activeId === slice.id}
                      dimmed={isHidden}
                      variant="row"
                      ariaPressed={!isHidden}
                      onActivate={() => activateHover(slice.id)}
                      onDeactivate={deactivate}
                      onClick={() => toggleSlice(slice.id)}
                    >
                      <span className="min-w-0 flex-1 truncate text-left">
                        {slice.label}
                      </span>
                      <span className="tabular-nums">
                        {numberFormatter.format(slice.value)}
                      </span>
                    </ChartLegendPill>
                  );
                })}
              </div>
            ) : (
              <div
                className="flex flex-wrap justify-center gap-1.5"
                style={{ animation: "donut-legend-up 0.4s 0.4s ease-out both" }}
              >
                {slices.map((slice) => {
                  const isHidden = hiddenIds.has(slice.id);
                  return (
                    <ChartLegendPill
                      key={slice.id}
                      label={slice.label}
                      color={colorScale(slice.id)}
                      active={activeId === slice.id}
                      dimmed={isHidden}
                      ariaPressed={!isHidden}
                      ariaLabel={`${slice.label}: ${numberFormatter.format(slice.value)}`}
                      onActivate={() => activateHover(slice.id)}
                      onDeactivate={deactivate}
                      onClick={() => toggleSlice(slice.id)}
                    />
                  );
                })}
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
