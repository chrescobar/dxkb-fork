import type { AngleSpan } from "./paths";

export interface IndexedSpan extends AngleSpan {
  /** The item's index in its track's item list. */
  index: number;
}

export interface SpanIndex {
  spans: readonly IndexedSpan[];
  /** The widest span, so a lookup knows how far back an overlapping span can start. */
  widest: number;
}

export function indexSpans(spans: readonly IndexedSpan[]): SpanIndex {
  const sorted = [...spans].sort((a, b) => a.startAngle - b.startAngle);
  return {
    spans: sorted,
    widest: sorted.reduce((widest, span) => Math.max(widest, span.endAngle - span.startAngle), 0),
  };
}

/**
 * The span under `angle`, else the nearest within `tolerance` radians: a
 * 1 kb gene on a 5 Mb genome is a fraction of a pixel wide. Of the spans
 * that contain the angle, the one that starts last (the innermost of nested
 * features). Binary search, then a walk back over spans that could overlap.
 */
export function spanAt(
  index: SpanIndex,
  angle: number,
  tolerance: number,
): IndexedSpan | undefined {
  const { spans } = index;
  let low = 0;
  let high = spans.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (spans[middle].startAngle <= angle + tolerance) low = middle + 1;
    else high = middle;
  }
  const earliest = angle - tolerance - index.widest;
  let best: IndexedSpan | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let at = low - 1; at >= 0 && spans[at].startAngle >= earliest; at -= 1) {
    const span = spans[at];
    const distance =
      angle < span.startAngle
        ? span.startAngle - angle
        : angle > span.endAngle
          ? angle - span.endAngle
          : 0;
    if (distance <= tolerance && distance < bestDistance) {
      best = span;
      bestDistance = distance;
      if (distance === 0) break;
    }
  }
  return best;
}
