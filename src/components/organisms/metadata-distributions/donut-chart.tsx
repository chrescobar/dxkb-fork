"use client";

import { Connector } from "@visx/annotation";
import { Group } from "@visx/group";
import { scaleOrdinal } from "@visx/scale";
import { Pie } from "@visx/shape";
import { useTooltip } from "@visx/tooltip";

import { facetDisplayLabel } from "@/components/organisms/facet-label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const chartWidth = 460;
const chartHeight = 240;
const chartCenterX = chartWidth / 2;
const chartCenterY = chartHeight / 2;
const outerRadius = 60;
const innerRadius = 38;
const subjectRadius = outerRadius + 4;
const labelTop = 20;
const labelBottom = chartHeight - 20;
const labelMinGap = 42;
const naturalYScale = 85;
const labelLineMaxChars = 16;
const labelMaxLines = 2;
const labelLineHeight = 17;
const rightLabelX = 330;
const rightSwatchX = 326;
const leftLabelX = 130;
const leftSwatchX = 134;
const svgPrecision = 1000;
const aggregateLabel = "Others";
const fallbackAggregateLabel = "Other values";

interface AnnotationDatum {
  arc: DonutPieArcDatum;
  labelY: number;
  side: "left" | "right";
  subjectX: number;
  subjectY: number;
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
  const top = positive.slice(0, 5);
  const otherValue = positive
    .slice(5)
    .reduce((sum, datum) => sum + datum.value, 0);
  return otherValue > 0
    ? [
        ...top,
        {
          id: "aggregate-other",
          label: uniqueAggregateLabel(top.map((datum) => datum.label)),
          value: otherValue,
        },
      ]
    : top;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundSvgNumber(value: number) {
  return Math.round(value * svgPrecision) / svgPrecision;
}

function compareLabels(a: string, b: string) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function truncateLabelLine(line: string): string {
  if (line.length <= labelLineMaxChars) return line;

  return `${line.slice(0, labelLineMaxChars - 3).trimEnd()}...`;
}

function wrapLabel(label: string): string[] {
  const words = label.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (word.length > labelLineMaxChars) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }

      lines.push(truncateLabelLine(word));
      continue;
    }

    if (!currentLine) {
      currentLine = word;
      continue;
    }

    const nextLine = `${currentLine} ${word}`;
    if (nextLine.length <= labelLineMaxChars) {
      currentLine = nextLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  if (lines.length <= labelMaxLines) return lines;

  const visibleLines = lines.slice(0, labelMaxLines - 1);
  visibleLines.push(
    truncateLabelLine(lines.slice(labelMaxLines - 1).join(" ")),
  );

  return visibleLines;
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
    };
  });

  return (["left", "right"] as const).flatMap((side) => {
    const group = positioned
      .filter((datum) => datum.side === side)
      .sort(
        (a, b) =>
          a.labelY - b.labelY ||
          compareLabels(a.arc.data.label, b.arc.data.label),
      );

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
  const total = slices.reduce((sum, datum) => sum + datum.value, 0);
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
        <CardDescription>
          {total > 0
            ? `${numberFormatter.format(total)} records in shown buckets`
            : "No facet data"}
        </CardDescription>
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
              className="mx-auto w-full max-w-[25rem]"
            >
              <Group top={chartCenterY} left={chartCenterX}>
                <Pie<DonutChartDatum>
                  data={slices}
                  pieValue={(datum) => datum.value}
                  outerRadius={outerRadius}
                  innerRadius={innerRadius}
                  padAngle={0.012}
                >
                  {(pie) => (
                    <>
                      {pie.arcs.map((arc) => (
                        <path
                          key={arc.data.id}
                          suppressHydrationWarning
                          d={pie.path(arc) ?? undefined}
                          fill={colorScale(arc.data.id)}
                          stroke="var(--card)"
                          strokeWidth={2}
                          tabIndex={0}
                          aria-label={`${arc.data.label}: ${numberFormatter.format(arc.data.value)}`}
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
                        />
                      ))}
                      {annotationData(pie.arcs).map((datum) => {
                        const isRight = datum.side === "right";
                        const swatchX = isRight ? rightSwatchX : leftSwatchX;
                        const textX = isRight ? rightLabelX : leftLabelX;
                        const valueLabel = numberFormatter.format(
                          datum.arc.data.value,
                        );
                        const annotationTitle = `${datum.arc.data.label}: ${valueLabel}`;
                        const labelLines = wrapLabel(datum.arc.data.label);
                        const labelX = textX - chartCenterX;
                        const labelY =
                          datum.labelY -
                          chartCenterY -
                          4 -
                          (labelLines.length - 1) * labelLineHeight;

                        return (
                          <g key={`annotation-${datum.arc.data.id}`}>
                            <title>{annotationTitle}</title>
                            <Connector
                              x={datum.subjectX - chartCenterX}
                              y={datum.subjectY - chartCenterY}
                              dx={swatchX - datum.subjectX}
                              dy={datum.labelY - datum.subjectY}
                              type="line"
                              stroke={colorScale(datum.arc.data.id)}
                              pathProps={{ strokeWidth: 1.25 }}
                            />
                            <line
                              x1={swatchX - chartCenterX}
                              y1={datum.labelY - chartCenterY - 8}
                              x2={swatchX - chartCenterX}
                              y2={datum.labelY - chartCenterY + 8}
                              stroke={colorScale(datum.arc.data.id)}
                              strokeWidth={2}
                            />
                            <text
                              x={labelX}
                              y={labelY}
                              textAnchor={isRight ? "start" : "end"}
                              className="fill-foreground text-[15px] leading-tight font-semibold"
                            >
                              {labelLines.map((line, index) => (
                                <tspan
                                  key={`${datum.arc.data.label}-${index}`}
                                  x={labelX}
                                  dy={index === 0 ? 0 : labelLineHeight}
                                >
                                  {line}
                                </tspan>
                              ))}
                            </text>
                            <text
                              x={labelX}
                              y={datum.labelY - chartCenterY + 9}
                              textAnchor={isRight ? "start" : "end"}
                              className="fill-muted-foreground text-[13px] tabular-nums"
                            >
                              {valueLabel}
                            </text>
                          </g>
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
