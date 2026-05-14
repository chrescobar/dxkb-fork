"use client";

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

const chartWidth = 540;
const chartHeight = 260;
const chartCenterX = chartWidth / 2;
const chartCenterY = chartHeight / 2;
const outerRadius = 104;
const innerRadius = 58;
const subjectRadius = outerRadius + 2;
const labelTop = 14;
const labelBottom = chartHeight - 14;
const labelMinGap = 58;
const naturalYScale = 104;
const labelWidth = 132;
const labelAnchorGap = 6;
const connectorMeetSlant = 10;
const titleFontSize = 14;
const titleLineHeight = 16;
const titleBaselineOffset = 12;
const valueFontSize = 12;
const valueLineHeight = 14;
const valueBaselineOffset = 10;
const titleValueGap = 2;
const averageTitleCharacterWidth = 7.5;
const maxTitleLines = 2;
const rightLabelX = chartWidth - 24 - labelWidth;
const leftLabelX = 24 + labelWidth;
const svgPrecision = 1000;
const aggregateLabel = "Others";
const fallbackAggregateLabel = "Other values";
const pieStartAngle = (150 * Math.PI) / 180;
const pieEndAngle = pieStartAngle + Math.PI * 2;

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

function truncateLine(line: string, maxLength: number) {
  if (line.length <= maxLength) return line;
  if (maxLength <= 3) return line.slice(0, maxLength);
  return `${line.slice(0, maxLength - 3).trimEnd()}...`;
}

function splitLongWord(word: string, maxLength: number) {
  const chunks: string[] = [];

  for (let index = 0; index < word.length; index += maxLength) {
    chunks.push(word.slice(index, index + maxLength));
  }

  return chunks;
}

function wrapLabelText(label: string) {
  const maxLineLength = Math.max(
    1,
    Math.floor(labelWidth / averageTitleCharacterWidth),
  );
  const words = label.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidates =
      word.length > maxLineLength ? splitLongWord(word, maxLineLength) : [word];

    for (const candidate of candidates) {
      const nextLine = currentLine ? `${currentLine} ${candidate}` : candidate;

      if (nextLine.length <= maxLineLength) {
        currentLine = nextLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = candidate;
      }
    }
  }

  if (currentLine) lines.push(currentLine);
  if (lines.length === 0) return [label];
  if (lines.length <= maxTitleLines) return lines;

  return [
    ...lines.slice(0, maxTitleLines - 1),
    truncateLine(lines.slice(maxTitleLines - 1).join(" "), maxLineLength),
  ];
}

function annotationLabelBlockHeight(titleLines: readonly string[]) {
  return titleLines.length * titleLineHeight + titleValueGap + valueLineHeight;
}

function connectorPath(
  subjectX: number,
  subjectY: number,
  labelX: number,
  labelY: number,
  side: AnnotationDatum["side"],
) {
  const slantOffset =
    side === "right" ? connectorMeetSlant : -connectorMeetSlant;

  return [
    `M${subjectX},${subjectY}`,
    `L${roundSvgNumber(labelX - slantOffset)},${subjectY}`,
    `L${roundSvgNumber(labelX)},${roundSvgNumber(labelY)}`,
  ].join("");
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
  const colorScale = scaleOrdinal<string, string>({
    domain: slices.map((datum) => datum.id),
    range: chartColors,
  });
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<DonutDatum>();

  return (
    <Card className="relative rounded-lg" size="sm">
      <CardHeader>
        <CardTitle className="text-lg!">{title}</CardTitle>
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
              className="mx-auto w-full max-w-135"
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
                          ? labelXRelative + labelAnchorGap
                          : labelXRelative - labelAnchorGap - labelWidth;
                        const titleLines = wrapLabelText(datum.arc.data.label);
                        const labelBlockHeight =
                          annotationLabelBlockHeight(titleLines);
                        const labelTopYRelative =
                          labelYRelative - labelBlockHeight / 2;
                        const textAnchor = isRight ? "start" : "end";
                        const textX = isRight
                          ? labelLeftXRelative
                          : labelLeftXRelative + labelWidth;
                        const valueY =
                          labelTopYRelative +
                          titleLines.length * titleLineHeight +
                          titleValueGap +
                          valueBaselineOffset;

                        return (
                          <g key={`annotation-${datum.arc.data.id}`}>
                            <path
                              className="visx-annotation-connector"
                              d={connectorPath(
                                subjectX,
                                subjectY,
                                labelXRelative,
                                labelYRelative,
                                datum.side,
                              )}
                              stroke={colorScale(datum.arc.data.id)}
                              strokeWidth={1.25}
                              fill="none"
                            />
                            <line
                              className="metadata-distribution-label-marker"
                              x1={labelXRelative}
                              y1={labelTopYRelative}
                              x2={labelXRelative}
                              y2={labelTopYRelative + labelBlockHeight}
                              stroke={colorScale(datum.arc.data.id)}
                              strokeWidth={2}
                            />
                            <text
                              className="metadata-distribution-title-label fill-foreground font-semibold"
                              textAnchor={textAnchor}
                              fontSize={titleFontSize}
                            >
                              {titleLines.map((line, index) => (
                                <tspan
                                  key={`${datum.arc.data.id}-title-${index}`}
                                  className="metadata-distribution-title-line"
                                  x={textX}
                                  y={
                                    labelTopYRelative +
                                    titleBaselineOffset +
                                    index * titleLineHeight
                                  }
                                >
                                  {line}
                                </tspan>
                              ))}
                            </text>
                            <text
                              className="metadata-distribution-value-label fill-muted-foreground tabular-nums"
                              textAnchor={textAnchor}
                              fontSize={valueFontSize}
                              x={textX}
                              y={valueY}
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
