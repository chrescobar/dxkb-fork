"use client";

import { Annotation, Connector, Label } from "@visx/annotation";
import { Group } from "@visx/group";
import { scaleOrdinal } from "@visx/scale";
import { Pie } from "@visx/shape";
import { useTooltip } from "@visx/tooltip";

import { facetDisplayLabel } from "@/components/organisms/facet-label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { numberFormatter } from "@/lib/services/organisms/utils";

interface DonutDatum {
  label: string;
  value: number;
}

interface DonutChartDatum extends DonutDatum {
  id: string;
}

interface DonutPieArcDatum {
  data: DonutChartDatum;
  startAngle: number;
  endAngle: number;
}

interface DonutChartProps {
  title: string;
  data: DonutDatum[];
}

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

const chartWidth = 560;
const chartHeight = 320;
const chartCenterX = chartWidth / 2;
const chartCenterY = chartHeight / 2;
const outerRadius = 80;
const innerRadius = 45;
const subjectRadius = outerRadius + 2;
const labelTop = 32;
const labelBottom = chartHeight - 32;
const labelMinGap = 56;
const naturalYScale = 120;
const labelWidth = 136;
const labelBlockHeight = 34;
const rightLabelX = chartWidth - 36 - labelWidth;
const leftLabelX = 36 + labelWidth;
const svgPrecision = 1000;
const aggregateLabel = "Others";
const fallbackAggregateLabel = "Other values";
const pieStartAngle = (150 * Math.PI) / 180;
const pieEndAngle = pieStartAngle + Math.PI * 2;
const minLabelsPerSide = 2;

class NoopResizeObserver {
  constructor(callback?: ResizeObserverCallback) {
    void callback;
  }

  observe(target: Element) {
    void target;
  }

  unobserve(target: Element) {
    void target;
  }

  disconnect() {
    return undefined;
  }
}

const resizeObserverPolyfill =
  typeof ResizeObserver === "undefined" ? NoopResizeObserver : undefined;

interface AnnotationDatum {
  arc: DonutPieArcDatum;
  labelY: number;
  side: "left" | "right";
  subjectX: number;
  subjectY: number;
}

interface PositionedAnnotationDatum extends AnnotationDatum {
  xOffset: number;
}

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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundSvgNumber(value: number) {
  return Math.round(value * svgPrecision) / svgPrecision;
}

function distributeLabelYs(naturalYs: number[]): number[] {
  const n = naturalYs.length;
  if (n === 0) return [];
  if (n === 1) return [...naturalYs];

  const range = labelBottom - labelTop;
  if ((n - 1) * labelMinGap > range) {
    return Array.from(
      { length: n },
      (_, i) => labelTop + (range * i) / (n - 1),
    );
  }

  const positions = [...naturalYs];

  for (let i = 1; i < n; i++) {
    if (positions[i] - positions[i - 1] < labelMinGap) {
      positions[i] = positions[i - 1] + labelMinGap;
    }
  }

  if (positions[n - 1] > labelBottom) {
    positions[n - 1] = labelBottom;
    for (let i = n - 2; i >= 0; i--) {
      if (positions[i + 1] - positions[i] < labelMinGap) {
        positions[i] = positions[i + 1] - labelMinGap;
      }
    }
  }

  if (positions[0] < labelTop) {
    positions[0] = labelTop;
    for (let i = 1; i < n; i++) {
      if (positions[i] - positions[i - 1] < labelMinGap) {
        positions[i] = positions[i - 1] + labelMinGap;
      }
    }
  }

  return positions;
}

function rebalanceAnnotationSides(
  positioned: PositionedAnnotationDatum[],
): PositionedAnnotationDatum[] {
  if (positioned.length < minLabelsPerSide * 2) return positioned;

  const balanced = positioned.map((datum) => ({ ...datum }));
  const moveClosestToCenter = (
    sourceSide: AnnotationDatum["side"],
    targetSide: AnnotationDatum["side"],
  ) => {
    const candidate = balanced
      .filter((datum) => datum.side === sourceSide)
      .sort((a, b) => Math.abs(a.xOffset) - Math.abs(b.xOffset))[0];

    if (candidate) {
      candidate.side = targetSide;
    }
  };

  let leftCount = balanced.filter((datum) => datum.side === "left").length;
  let rightCount = balanced.length - leftCount;

  while (leftCount < minLabelsPerSide && rightCount > minLabelsPerSide) {
    moveClosestToCenter("right", "left");
    leftCount += 1;
    rightCount -= 1;
  }

  while (rightCount < minLabelsPerSide && leftCount > minLabelsPerSide) {
    moveClosestToCenter("left", "right");
    rightCount += 1;
    leftCount -= 1;
  }

  return balanced;
}

function annotationData(arcs: DonutPieArcDatum[]): AnnotationDatum[] {
  const positioned = arcs.map((arc) => {
    const midpoint = (arc.startAngle + arc.endAngle) / 2;
    const xOffset = Math.sin(midpoint);
    const yOffset = -Math.cos(midpoint);

    return {
      arc,
      labelY: clamp(
        chartCenterY + yOffset * naturalYScale,
        labelTop,
        labelBottom,
      ),
      side: xOffset >= 0 ? ("right" as const) : ("left" as const),
      subjectX: roundSvgNumber(chartCenterX + xOffset * subjectRadius),
      subjectY: roundSvgNumber(chartCenterY + yOffset * subjectRadius),
      xOffset,
    };
  });

  return (["left", "right"] as const).flatMap((side) => {
    const group = rebalanceAnnotationSides(positioned)
      .filter((datum) => datum.side === side)
      .sort((a, b) => a.subjectY - b.subjectY);

    if (group.length === 0) return [];

    const positions = distributeLabelYs(group.map((datum) => datum.labelY));

    return group.map((datum, index) => ({
      ...datum,
      labelY: roundSvgNumber(positions[index]),
    }));
  });
}

export function DonutChart({ title, data }: DonutChartProps) {
  const slices = chartData(data);
  const _total = slices.reduce((sum, datum) => sum + datum.value, 0);
  const colorScale = scaleOrdinal<string, string>({
    domain: slices.map((datum) => datum.id),
    range: chartColors,
  });
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<DonutDatum>();

  return (
    <Card className="relative rounded-lg" size="sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {slices.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No distribution data was returned.
          </p>
        ) : (
          <div className="min-w-0 overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              role="img"
              aria-label={`${title} distribution`}
              className="mx-auto w-full max-w-full"
            >
              <Group top={chartCenterY} left={chartCenterX}>
                <Pie<DonutChartDatum>
                  data={slices}
                  pieValue={(datum) => datum.value}
                  outerRadius={outerRadius}
                  innerRadius={innerRadius}
                  padAngle={0.012}
                  startAngle={pieStartAngle}
                  endAngle={pieEndAngle}
                >
                  {(pie) => (
                    <>
                      {pie.arcs.map((arc) => {
                        const accessibleLabel = `${arc.data.label}: ${numberFormatter.format(arc.data.value)}`;

                        return (
                          <path
                            key={arc.data.id}
                            suppressHydrationWarning
                            d={pie.path(arc) ?? undefined}
                            fill={colorScale(arc.data.id)}
                            stroke="var(--card)"
                            strokeWidth={2}
                            tabIndex={0}
                            aria-label={accessibleLabel}
                            onMouseMove={(event) =>
                              showTooltip({
                                tooltipData: arc.data,
                                tooltipLeft: event.clientX,
                                tooltipTop: event.clientY,
                              })
                            }
                            onFocus={(event) => {
                              const rect =
                                event.currentTarget.getBoundingClientRect();
                              showTooltip({
                                tooltipData: arc.data,
                                tooltipLeft: rect.left + rect.width / 2,
                                tooltipTop: rect.top + rect.height / 2,
                              });
                            }}
                            onMouseLeave={hideTooltip}
                            onBlur={hideTooltip}
                          >
                            <title>{accessibleLabel}</title>
                          </path>
                        );
                      })}
                      {annotationData(pie.arcs).map((datum) => {
                        const isRight = datum.side === "right";
                        const labelX = isRight ? rightLabelX : leftLabelX;
                        const valueLabel = numberFormatter.format(
                          datum.arc.data.value,
                        );

                        const subjectX = datum.subjectX - chartCenterX;
                        const subjectY = datum.subjectY - chartCenterY;
                        const labelXRelative = labelX - chartCenterX;
                        const labelYRelative = datum.labelY - chartCenterY;
                        const labelLeftXRelative = isRight
                          ? labelXRelative
                          : labelXRelative - labelWidth;
                        const labelTopYRelative =
                          labelYRelative - labelBlockHeight / 2;

                        return (
                          <Annotation
                            key={`annotation-${datum.arc.data.id}`}
                            x={subjectX}
                            y={subjectY}
                            dx={labelXRelative - subjectX}
                            dy={labelYRelative - subjectY}
                          >
                            <Connector
                              stroke={colorScale(datum.arc.data.id)}
                              type="elbow"
                              pathProps={{ strokeWidth: 1.25 }}
                            />
                            <Label
                              className="opacity-100"
                              x={labelLeftXRelative}
                              y={labelTopYRelative}
                              title={datum.arc.data.label}
                              subtitle={valueLabel}
                              subtitleDy={16}
                              titleFontSize={14}
                              subtitleFontSize={12}
                              titleProps={{
                                className: "fill-foreground font-semibold",
                              }}
                              subtitleProps={{
                                className: "fill-muted-foreground tabular-nums",
                              }}
                              horizontalAnchor="start"
                              verticalAnchor="start"
                              showAnchorLine={false}
                              anchorLineStroke={colorScale(datum.arc.data.id)}
                              backgroundFill="none"
                              backgroundPadding={0}
                              resizeObserverPolyfill={resizeObserverPolyfill}
                              width={labelWidth}
                              maxWidth={labelWidth}
                            />
                          </Annotation>
                        );
                      })}
                    </>
                  )}
                </Pie>
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
          {tooltipData.label}: {numberFormatter.format(tooltipData.value)}
        </div>
      )}
    </Card>
  );
}
