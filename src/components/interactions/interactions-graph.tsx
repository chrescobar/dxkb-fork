"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";

import { useInteractions } from "@/lib/interactions/use-interactions";
import { toGraph } from "@/lib/interactions/to-graph";
import { defaultLayout } from "@/lib/interactions/renderer-capabilities";
import type { GraphCanvasHandle, GraphSelection, LayoutName } from "@/lib/interactions/types";

import { GraphToolbar } from "./graph-toolbar";
import { GraphLegend } from "./graph-legend";
import { GraphDetailPanel } from "./graph-detail-panel";

const SigmaCanvas = dynamic(() => import("./sigma/sigma-canvas"), {
  ssr: false,
  loading: () => <div className="flex size-full items-center justify-center text-sm text-muted-foreground">Loading graph…</div>,
});

const emptySelection: GraphSelection = { nodes: [], edges: [] };

interface InteractionsGraphProps {
  taxonId: number;
  q: string;
}

export function InteractionsGraph({ taxonId, q }: InteractionsGraphProps) {
  const { data, isPending, isError, error } = useInteractions(taxonId, q);
  const [layout, setLayout] = useState<LayoutName>(defaultLayout);
  const [selection, setSelection] = useState<GraphSelection>(emptySelection);
  const canvasHandleRef = useRef<GraphCanvasHandle | null>(null);

  function handleLayoutChange(name: LayoutName) {
    setLayout(name);
    canvasHandleRef.current?.runLayout(name);
  }

  if (isPending) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading interactions…</div>;
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-destructive">
        {error instanceof Error ? error.message : "Failed to load interactions."}
      </div>
    );
  }

  const { nodes, edges } = toGraph(data);

  if (nodes.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No interactions found.</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <GraphToolbar
        layout={layout}
        onLayoutChange={handleLayoutChange}
        onExport={() => { canvasHandleRef.current?.exportPng(); }}
      />
      <div className="flex min-h-0 flex-1">
        <div className="w-44 shrink-0 border-r p-2">
          <GraphLegend />
        </div>
        <div className="min-h-0 min-w-0 flex-1" role="img" aria-label="Protein-protein interaction network graph">
          <SigmaCanvas
            nodes={nodes}
            edges={edges}
            layout={layout}
            onSelect={setSelection}
            handleRef={canvasHandleRef}
          />
        </div>
        <div className="w-64 shrink-0 overflow-y-auto border-l" tabIndex={0}>
          <GraphDetailPanel selection={selection} />
        </div>
      </div>
    </div>
  );
}
