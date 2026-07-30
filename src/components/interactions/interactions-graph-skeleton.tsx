"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type { LayoutName } from "@/lib/interactions/types";

import { GraphActionBar } from "./graph-action-bar";
import { GraphLegend } from "./graph-legend";

interface InteractionsGraphSkeletonProps {
  layout: LayoutName;
  onLayoutChange: (layout: LayoutName) => void;
}

// Varied bar widths so the placeholder rows read as real gene names rather than
// a uniform template. 12 rows fills the visible w-60 column without scrolling.
const rowWidths = ["w-20", "w-16", "w-24", "w-14", "w-20", "w-28", "w-16", "w-24", "w-20", "w-14", "w-24", "w-16"];

/**
 * Loading state for the interactions graph. Mirrors the loaded 3-column layout
 * (legend/list · canvas · detail) so switching to the real graph doesn't shift
 * anything: real legend + real (disabled) action bar, skeleton protein rows, and
 * a spinner where the canvas will render. The real toolbar/keyword search is
 * rendered by the parent above this, in every state.
 */
export function InteractionsGraphSkeleton({ layout, onLayoutChange }: InteractionsGraphSkeletonProps) {
  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex w-60 shrink-0 flex-col rounded-tl-md border-x border-t bg-card">
        <div className="border-b p-2">
          <GraphLegend />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
          {/* Stand-in for the CommandInput search box. */}
          <Skeleton className="h-8 w-full" />
          <div className="flex flex-col gap-1.5">
            {rowWidths.map((width, i) => (
              <div key={i} className="flex items-center gap-2 p-1">
                <Skeleton className="size-2.5 shrink-0 rounded-full" />
                <Skeleton className={`h-3 ${width}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col border-t">
        <GraphActionBar layout={layout} onLayoutChange={onLayoutChange} onExport={() => undefined} exportReady={false} />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-6 text-muted-foreground" />
          Loading interactions…
        </div>
      </div>
      <div className="w-64 shrink-0 border-t border-l bg-card">
        <p className="p-3 text-sm text-muted-foreground">Select a node or edge to see details.</p>
      </div>
    </div>
  );
}
