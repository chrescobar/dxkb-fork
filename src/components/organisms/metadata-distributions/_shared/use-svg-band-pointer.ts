import type { ScaleBand } from "@visx/vendor/d3-scale";
import type { MouseEvent, RefObject } from "react";

import { chartMarginLeft, chartWidth } from "./chart-dimensions";

/**
 * Convert a pointer event over the chart overlay into the nearest band index.
 * Uses nearest-band-center (not Math.round/step) so paddingOuter doesn't skew
 * the mapping — see `bar-chart.tsx` regression that motivated this helper.
 */
export function nearestBandIndex<T extends { toString(): string }>(
  event: MouseEvent<SVGElement>,
  svgRef: RefObject<SVGSVGElement | null>,
  xScale: ScaleBand<T>,
  data: readonly T[],
  marginLeft: number = chartMarginLeft,
): number | null {
  const svgRect = svgRef.current?.getBoundingClientRect();
  const scaleX = svgRect && svgRect.width > 0 ? chartWidth / svgRect.width : 1;
  const mouseX = svgRect
    ? (event.clientX - svgRect.left) * scaleX - marginLeft
    : event.clientX - marginLeft;
  const halfBand = xScale.bandwidth() / 2;
  let closestIdx = -1;
  let closestDist = Infinity;
  data.forEach((datum, idx) => {
    const center = (xScale(datum as never) ?? 0) + halfBand;
    const dist = Math.abs(mouseX - center);
    if (dist < closestDist) {
      closestDist = dist;
      closestIdx = idx;
    }
  });
  return closestIdx >= 0 ? closestIdx : null;
}
