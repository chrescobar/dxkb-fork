"use client";

import { useEffect, useImperativeHandle, useState } from "react";
import { SigmaContainer, useLoadGraph, useRegisterEvents, useSetSettings, useSigma } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import Graph from "graphology";
import { EdgeRectangleProgram } from "sigma/rendering";
import { downloadAsImage } from "@sigma/export-image";

import { colors, renderEdge, renderEdgeExperimental } from "@/lib/interactions/graph-theme";
import { runGraphLayout } from "@/lib/interactions/layouts";
import type { GEdge, GNode, GraphCanvasProps, GraphSelection, LayoutName } from "@/lib/interactions/types";

function buildGraph(nodes: GNode[], edges: GEdge[]): Graph {
  const g = new Graph({ multi: true });
  for (const n of nodes) {
    g.addNode(n.id, {
      ...n,
      label: n.gene || n.id,
      // Small nodes so ~1,900 points don't overlap when zoomed out, and so the
      // connecting edges of tight 2–4 node clusters stay visible at any zoom.
      size: 2.5,
      color: n.kind === "host" ? colors.host : colors.microbial,
      x: Math.random(),
      y: Math.random(),
    });
  }
  for (const e of edges) {
    if (g.hasNode(e.source) && g.hasNode(e.target)) {
      g.addEdgeWithKey(e.id, e.source, e.target, {
        ...e,
        size: 1,
        // Translucent (premultiplied) so ~4,400 overlapping edges read as
        // individual threads and accumulate into a density gradient instead of a
        // solid disk. Derived from the theme in graph-theme.ts so dense-region
        // color matches the legend swatches; see renderEdge for the alpha/
        // premultiply rationale. Wider rectangle edges give pointer events a
        // usable hit target without making the mesh opaque.
        color: e.experimental ? renderEdgeExperimental : renderEdge,
      });
    }
  }
  return g;
}


interface GraphLoaderProps {
  nodes: GNode[];
  edges: GEdge[];
  layout: LayoutName;
}

function GraphLoader({ nodes, edges, layout }: GraphLoaderProps) {
  const loadGraph = useLoadGraph();
  useEffect(() => {
    const g = buildGraph(nodes, edges);
    runGraphLayout(g, layout);
    loadGraph(g);
    // Layout is intentionally excluded: the imperative handle's runLayout
    // re-runs the layout in place via useSigma, without reloading the graph.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, loadGraph]);
  return null;
}

interface TooltipState {
  x: number;
  y: number;
  node?: GNode;
  edge?: GEdge;
}

interface GraphEventsProps {
  onSelect: (sel: GraphSelection) => void;
  onHover: (tooltip: TooltipState | null) => void;
  selectedId: string | null;
  selectedKind: "node" | "edge" | null;
  onSelectId: (id: string | null, kind: "node" | "edge" | null) => void;
}

function GraphEvents({ onSelect, onHover, selectedId, selectedKind, onSelectId }: GraphEventsProps) {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const setSettings = useSetSettings();

  useEffect(() => {
    registerEvents({
      clickNode: ({ node }) => {
        onSelectId(node, "node");
        const data = sigma.getGraph().getNodeAttributes(node) as GNode;
        onSelect({ nodes: [data], edges: [] });
      },
      clickEdge: ({ edge }) => {
        onSelectId(edge, "edge");
        const data = sigma.getGraph().getEdgeAttributes(edge) as GEdge;
        onSelect({ nodes: [], edges: [data] });
      },
      clickStage: () => {
        onSelectId(null, null);
        onSelect({ nodes: [], edges: [] });
      },
      enterNode: ({ node, event }) => {
        const data = sigma.getGraph().getNodeAttributes(node) as GNode;
        onHover({ x: event.x, y: event.y, node: data });
      },
      leaveNode: () => { onHover(null); },
      enterEdge: ({ edge, event }) => {
        const data = sigma.getGraph().getEdgeAttributes(edge) as GEdge;
        onHover({ x: event.x, y: event.y, edge: data });
      },
      leaveEdge: () => { onHover(null); },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerEvents, sigma]);

  useEffect(() => {
    setSettings({
      nodeReducer: (node, data) =>
        selectedKind === "node" && node === selectedId
          ? { ...data, color: colors.selected, zIndex: 1 }
          : data,
      edgeReducer: (edge, data) =>
        selectedKind === "edge" && edge === selectedId
          ? { ...data, color: colors.edgeSelected, zIndex: 1 }
          : data,
    });
  }, [setSettings, selectedId, selectedKind]);

  return null;
}

function HandleBridge({
  handleRef,
  onReady,
}: {
  handleRef: GraphCanvasProps["handleRef"];
  onReady?: () => void;
}) {
  const sigma = useSigma();

  useImperativeHandle(
    handleRef,
    () => ({
      runLayout: (name) => {
        const g = sigma.getGraph();
        runGraphLayout(g, name);
        sigma.refresh();
        // Sigma auto-frames only on initial load. Switching layout in place can
        // shift the graph's normalized extent (packed layouts especially), so
        // reset the camera to re-fit the new positions instead of leaving it
        // panned/zoomed to the previous layout.
        void sigma.getCamera().animatedReset();
      },
      exportPng: () => {
        void downloadAsImage(sigma, { fileName: "BVBRC_interaction" });
      },
    }),
    [sigma],
  );

  // Runs after useImperativeHandle's layout effect commits handleRef.current,
  // so the parent only learns "ready" once the handle is actually callable.
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return null;
}

export function SigmaCanvas({ nodes, edges, layout, onSelect, handleRef, onReady }: GraphCanvasProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<"node" | "edge" | null>(null);

  return (
    <div className="relative size-full">
      <SigmaContainer
        style={{ width: "100%", height: "100%" }}
        settings={{
          renderEdgeLabels: false,
          // "rectangle" (thick, hit-testable edges) isn't auto-registered — Sigma
          // only ships "line" and "arrow" by default — so register the program
          // for that type key here, or loadGraph throws "could not find a suitable
          // program for edge type rectangle".
          defaultEdgeType: "rectangle",
          edgeProgramClasses: { rectangle: EdgeRectangleProgram },
          enableEdgeEvents: true,
        }}
      >
        <GraphLoader nodes={nodes} edges={edges} layout={layout} />
        <GraphEvents
          onSelect={onSelect}
          onHover={setTooltip}
          selectedId={selectedId}
          selectedKind={selectedKind}
          onSelectId={(id, kind) => { setSelectedId(id); setSelectedKind(kind); }}
        />
        <HandleBridge handleRef={handleRef} onReady={onReady} />
      </SigmaContainer>
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 max-w-xs rounded-md bg-primary px-2 py-1 text-xs text-background shadow-md"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          {tooltip.node && (
            <>
              <div>{tooltip.node.id}</div>
              <div>{tooltip.node.genome}</div>
              <div>{tooltip.node.refseqLocusTag}</div>
              <div>{tooltip.node.gene}</div>
              <div>{tooltip.node.interactorDesc}</div>
            </>
          )}
          {tooltip.edge && (
            <>
              <div>{tooltip.edge.interactionType}</div>
              <div>{tooltip.edge.detectionMethod}</div>
              <div>{tooltip.edge.evidence}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
