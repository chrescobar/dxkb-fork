// Shared chart palette. Charts that need fewer colors (e.g. donut → 5 + Others)
// take a `slice()` rather than maintaining their own copy.
export const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
  "var(--chart-9)",
  "var(--chart-10)",
];

export const donutFallbackColor = "var(--muted-foreground)";

/**
 * Calculates a fixed-position tooltip style that flips horizontally or
 * vertically when the tooltip would overflow the viewport edge.
 *
 * When flipping horizontally, `right` is returned (instead of `left`) so the
 * tooltip's right edge anchors near the cursor — no width estimation needed.
 *
 * @param cx - cursor clientX
 * @param cy - cursor clientY
 * @param estimatedWidth - estimated tooltip width in px (used only to decide whether to flip)
 * @param estimatedHeight - estimated tooltip height in px
 * @param offsetX - preferred x offset from cursor (positive = right)
 * @param offsetY - preferred y offset from cursor (negative = above)
 */
export function chartTooltipStyle(
  cx: number,
  cy: number,
  estimatedWidth: number,
  estimatedHeight: number,
  offsetX = 12,
  offsetY = -36,
): { left?: number; right?: number; top: number } {
  const vw = typeof window !== "undefined" ? window.innerWidth : 9999;
  const vh = typeof window !== "undefined" ? window.innerHeight : 9999;

  // Flip horizontally: use `right` (viewport-relative) so the tooltip's right
  // edge sits offsetX px from the cursor, regardless of actual tooltip width.
  const flipX = cx + offsetX + estimatedWidth > vw;
  const xStyle = flipX
    ? { right: vw - cx + offsetX }
    : { left: cx + offsetX };

  const top =
    cy + offsetY < 0
      ? cy + Math.abs(offsetY)
      : cy + offsetY + estimatedHeight > vh
        ? cy - Math.abs(offsetY) - estimatedHeight
        : cy + offsetY;

  return { ...xStyle, top };
}
