"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { useInteractions } from "@/lib/interactions/use-interactions";
import { toGraph } from "@/lib/interactions/to-graph";
import { defaultLayout } from "@/lib/interactions/renderer-capabilities";
import type { GEdge, GNode, GraphCanvasHandle, GraphCanvasProps, GraphSelection, LayoutName } from "@/lib/interactions/types";

import { GraphToolbar } from "./graph-toolbar";
import { GraphLegend } from "./graph-legend";
import { GraphDetailPanel } from "./graph-detail-panel";
import { GraphNodeList } from "./graph-node-list";

const SigmaCanvas = dynamic<GraphCanvasProps>(() => import("./sigma/sigma-canvas").then((mod) => mod.SigmaCanvas), {
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
  const [canvasReady, setCanvasReady] = useState(false);
  const canvasHandleRef = useRef<GraphCanvasHandle | null>(null);
  // Keyed on the query data reference so selecting a node/edge (which only
  // updates `selection`) doesn't rebuild nodes/edges. SigmaCanvas reloads and
  // re-lays out the whole graph whenever its nodes/edges props change
  // identity, which would otherwise reset pan/zoom and node positions on
  // every selection for the intended thousands-node datasets.
  const graph = useMemo(() => (data ? toGraph(data) : { nodes: [], edges: [] }), [data]);

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

  const { nodes, edges } = graph;

  if (nodes.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No interactions found.</div>;
  }

  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const selectedNode = selection.nodes[0] as GNode | undefined;
  const incidentEdges = selectedNode
    ? edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  function selectNode(node: GNode) {
    setSelection({ nodes: [node], edges: [] });
  }
  function selectEdge(edge: GEdge) {
    setSelection({ nodes: [], edges: [edge] });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <GraphToolbar
        layout={layout}
        onLayoutChange={handleLayoutChange}
        onExport={() => { canvasHandleRef.current?.exportPng(); }}
        exportReady={canvasReady}
      />
      <div className="flex min-h-0 flex-1">
        <div className="flex w-60 shrink-0 flex-col rounded-tl-md border-l border-r border-t">
          <div className="border-b p-2">
            <GraphLegend />
          </div>
          <div className="min-h-0 flex-1">
            <GraphNodeList
              nodes={nodes}
              selectedId={selectedNode?.id ?? null}
              onSelectNode={selectNode}
            />
          </div>
        </div>
        {/* Canvas is a pointer-only WebGL surface with no accessible name: the
            node list (left) and detail panel (right) are the keyboard-operable
            path to the same node/edge selection, so hide the decorative render
            from assistive tech rather than exposing it as a static image. */}
        <div className="min-h-0 min-w-0 flex-1 border-t" aria-hidden="true">
          <SigmaCanvas
            nodes={nodes}
            edges={edges}
            layout={layout}
            selection={selection}
            onSelect={setSelection}
            handleRef={canvasHandleRef}
            onReady={() => { setCanvasReady(true); }}
          />
        </div>
        <div className="w-64 shrink-0 overflow-y-auto border-l border-t" tabIndex={0} aria-label="Selection details">
          <GraphDetailPanel
            selection={selection}
            incidentEdges={incidentEdges}
            nodesById={nodesById}
            onSelectEdge={selectEdge}
          />
        </div>
      </div>
    </div>
  );
}
