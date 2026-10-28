"use client";

import type { CSSProperties } from "react";
import type { FigureHit } from "@/lib/circular-viewer/drawing";
import { cn } from "@/lib/utils";
import { ItemFieldList, itemTitle } from "./circular-viewer-item-fields";

/**
 * Legacy's hover popup (`TooltipDialog` at the pointer, `formatPopupContent`),
 * placed beside the pointer on the side toward the figure's middle: right of
 * a pointer on the left half, left of one on the right half, below one on the
 * upper half and above one on the lower. Placed always below and right, it ran
 * off the page at 3 o'clock; legacy's dijit popup flipped at the edge too.
 * `left`/`top` are the pointer's place in the figure's `width` × `height` box.
 */
export function CircularViewerTooltip({
  hit,
  left,
  top,
  width,
  height,
}: {
  hit: FigureHit;
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  const onRight = left > width / 2;
  const onLower = top > height / 2;
  return (
    <div
      role="tooltip"
      className={cn(
        "pointer-events-none absolute z-10 max-w-xs rounded-lg border bg-popover p-3 text-xs text-popover-foreground shadow-lg",
        onRight ? "right-(--tip-x) -translate-x-3" : "left-(--tip-x) translate-x-3",
        onLower ? "bottom-(--tip-y) -translate-y-3" : "top-(--tip-y) translate-y-3",
      )}
      style={
        {
          "--tip-x": `${String(onRight ? width - left : left)}px`,
          "--tip-y": `${String(onLower ? height - top : top)}px`,
        } as CSSProperties
      }
    >
      <p className="mb-1 font-medium">{itemTitle(hit.item)}</p>
      <ItemFieldList item={hit.item} full={false} />
    </div>
  );
}
