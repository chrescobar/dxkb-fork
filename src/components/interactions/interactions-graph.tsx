"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { useInteractions } from "@/lib/interactions/use-interactions";
import { toGraph } from "@/lib/interactions/to-graph";
import {
  buildGraphSelectionIndex,
  selectHubs,
  selectSubgraphs,
} from "@/lib/interactions/graph-selections";
import { defaultLayout } from "@/lib/interactions/renderer-capabilities";
import type {
  GEdge,
  GNode,
  GraphCanvasHandle,
  GraphCanvasProps,
  GraphSelection,
  HubSelection,
  LayoutName,
  SubgraphSelection,
} from "@/lib/interactions/types";

import { GraphToolbar } from "./graph-toolbar";
import { GraphActionBar } from "./graph-action-bar";
import { GraphLegend } from "./graph-legend";
import { GraphDetailPanel } from "./graph-detail-panel";
import { GraphNodeList } from "./graph-node-list";
import { InteractionsGraphSkeleton } from "./interactions-graph-skeleton";

const SigmaCanvas = dynamic<GraphCanvasProps>(
  () => import("./sigma/sigma-canvas").then((mod) => mod.SigmaCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
        Loading graph…
      </div>
    ),
  },
);

const emptySelection: GraphSelection = { nodes: [], edges: [] };

interface InteractionsGraphProps {
  taxonId: number;
  q: string;
  /** The Table subtab's current RQL filter, including the shared keyword. */
  tableFilter?: string;
  keywordValue: string;
  onKeywordChange: (value: string) => void;
}

export function InteractionsGraph({
  taxonId,
  q,
  tableFilter,
  keywordValue,
  onKeywordChange,
}: InteractionsGraphProps) {
  // The table filter already includes the shared keyword and any table facets.
  const combinedQuery = useMemo(() => {
    const cleanQ = q.split("#")[0];
    const parts = [cleanQ, tableFilter].filter(
      (p): p is string => Boolean(p) && p !== "false",
    );
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0];
    return `and(${parts.join(",")})`;
  }, [q, tableFilter]);
  const { data, isPending, isError, error } = useInteractions(
    taxonId,
    combinedQuery,
  );
  const [layout, setLayout] = useState<LayoutName>(defaultLayout);
  const [selection, setSelection] = useState<GraphSelection>(emptySelection);
  const [activeSubgraph, setActiveSubgraph] =
    useState<SubgraphSelection | null>(null);
  const [activeHub, setActiveHub] = useState<HubSelection | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const canvasHandleRef = useRef<GraphCanvasHandle | null>(null);
  const [graphSource, setGraphSource] = useState({ combinedQuery, data });
  if (
    graphSource.combinedQuery !== combinedQuery ||
    graphSource.data !== data
  ) {
    setGraphSource({ combinedQuery, data });
    setSelection(emptySelection);
    setActiveSubgraph(null);
    setActiveHub(null);
  }

  // Keyed on the query data reference so selecting a node/edge (which only
  // updates `selection`) doesn't rebuild nodes/edges. SigmaCanvas reloads and
  // re-lays out the whole graph whenever its nodes/edges props change
  // identity, which would otherwise reset pan/zoom and node positions on
  // every selection for the intended thousands-node datasets.
  const graph = useMemo(
    () => (data ? toGraph(data) : { nodes: [], edges: [] }),
    [data],
  );
  const selectionIndex = useMemo(
    () => buildGraphSelectionIndex(graph.nodes, graph.edges),
    [graph.nodes, graph.edges],
  );

  function handleLayoutChange(name: LayoutName) {
    setLayout(name);
    canvasHandleRef.current?.runLayout(name);
  }

  const toolbar = (
    <GraphToolbar filterValue={keywordValue} onFilterChange={onKeywordChange} />
  );

  // Toolbar (and its keyword box) renders in every state — including
  // loading/error/empty — so a keyword filter that matches nothing doesn't
  // strand the user without a way to see or clear it.
  if (isPending) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {toolbar}
        <InteractionsGraphSkeleton
          layout={layout}
          onLayoutChange={handleLayoutChange}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {toolbar}
        <div className="flex flex-1 items-center justify-center text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Failed to load interactions."}
        </div>
      </div>
    );
  }

  const { nodes, edges } = graph;

  if (nodes.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {toolbar}
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          No interactions found.
        </div>
      </div>
    );
  }

  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const selectedNodeIds = new Set(selection.nodes.map((node) => node.id));
  const selectedNode =
    selection.nodes.length === 1 ? selection.nodes[0] : undefined;
  const incidentEdges = selectedNode
    ? edges.filter(
        (e) => e.source === selectedNode.id || e.target === selectedNode.id,
      )
    : [];

  function clearActivePreset() {
    setActiveSubgraph(null);
    setActiveHub(null);
  }
  function selectNode(node: GNode) {
    clearActivePreset();
    setSelection({ nodes: [node], edges: [] });
  }
  function selectEdge(edge: GEdge) {
    clearActivePreset();
    setSelection({ nodes: [], edges: [edge] });
  }
  function handleSelectSubgraphs(threshold: SubgraphSelection) {
    setActiveSubgraph(threshold);
    setActiveHub(null);
    setSelection(selectSubgraphs(selectionIndex, threshold));
  }
  function handleSelectHubs(threshold: HubSelection) {
    setActiveSubgraph(null);
    setActiveHub(threshold);
    setSelection(selectHubs(selectionIndex, threshold));
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {toolbar}
      <div className="flex min-h-0 flex-1">
        <div className="flex w-60 shrink-0 flex-col rounded-tl-md border-x border-t bg-card">
          <div className="border-b p-3">
            <GraphLegend />
          </div>
          <div className="min-h-0 flex-1">
            <GraphNodeList
              nodes={nodes}
              selectedIds={selectedNodeIds}
              onSelectNode={selectNode}
            />
          </div>
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col border-t">
          <GraphActionBar
            layout={layout}
            activeSubgraph={activeSubgraph}
            activeHub={activeHub}
            onLayoutChange={handleLayoutChange}
            onExport={() => {
              canvasHandleRef.current?.exportPng();
            }}
            onSelectSubgraphs={handleSelectSubgraphs}
            onSelectHubs={handleSelectHubs}
            exportReady={canvasReady}
          />
          {/* Canvas is a pointer-only WebGL surface with no accessible name: the
              node list (left) and detail panel (right) are the keyboard-operable
              path to the same node/edge selection, so hide the decorative render
              from assistive tech rather than exposing it as a static image. */}
          <div className="min-h-0 flex-1" aria-hidden="true">
            <SigmaCanvas
              nodes={nodes}
              edges={edges}
              layout={layout}
              selection={selection}
              onSelect={(nextSelection) => {
                clearActivePreset();
                setSelection(nextSelection);
              }}
              handleRef={canvasHandleRef}
              onReady={() => {
                setCanvasReady(true);
              }}
            />
          </div>
        </div>
        <div
          className="w-64 shrink-0 overflow-y-auto border-t border-l bg-card"
          tabIndex={0}
          aria-label="Selection details"
        >
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
