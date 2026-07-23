"use client";

import { useEffect, useImperativeHandle, useState } from "react";
import { SigmaContainer, useLoadGraph, useRegisterEvents, useSetSettings, useSigma } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import circular from "graphology-layout/circular";
import random from "graphology-layout/random";
import { downloadAsImage } from "@sigma/export-image";

import { colors } from "@/lib/interactions/graph-theme";
import type { GEdge, GNode, GraphCanvasProps, GraphSelection, LayoutName } from "@/lib/interactions/types";

function buildGraph(nodes: GNode[], edges: GEdge[]): Graph {
  const g = new Graph({ multi: true });
  for (const n of nodes) {
    g.addNode(n.id, {
      ...n,
      label: n.gene || n.id,
      // Small nodes so ~1,900 points don't overlap when zoomed out, and so the
      // connecting edges of tight 2–4 node clusters stay visible at any zoom.
      size: 2,
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
        // Translucent so ~4,400 overlapping edges read as individual threads
        // and accumulate into a density gradient (like the legacy view) instead
        // of stacking into a solid disk. Sigma blends with premultiplied alpha
        // (blendFunc ONE, ONE_MINUS_SRC_ALPHA) but its edge shader emits STRAIGHT
        // alpha, so a plain #rrggbbaa washes out to white. We premultiply RGB by
        // alpha ourselves: 0x38 ≈ 22% alpha applied to edgeExperimental (#3F51B5
        // → #0E1228) and edge (#555555 → #131313).
        color: e.experimental ? "#0E122838" : "#13131338",
      });
    }
  }
  return g;
}

function assignGrid(g: Graph) {
  const perRow = Math.ceil(Math.sqrt(g.order));
  let i = 0;
  g.forEachNode((node) => {
    g.setNodeAttribute(node, "x", i % perRow);
    g.setNodeAttribute(node, "y", Math.floor(i / perRow));
    i += 1;
  });
}

// Port of cytoscape.js's concentric layout (the legacy renderer's algorithm) —
// graphology/Sigma has no equivalent, and the earlier hand-rolled version
// (one thin ring per distinct degree, near-linear radius) collapsed into a
// uniform disk instead of the legacy look. Faithful port so it matches by
// construction: highest-degree nodes in the centre, lowest on the outer rings;
// nodes grouped into a few fat rings by a `levelWidth` degree band
// (default maxDegree/4); each ring's radius is max(chord-fit, prevRing + minDist)
// where chord-fit = minDist / (2 sin(π/n)) seats n nodes minDist apart — a
// populous low-degree ring jumps to a large radius, opening the annular gap
// between the dense core and the sparse perimeter. minDist is arbitrary (=1):
// every radius scales linearly with it and Sigma's camera auto-fits, so only
// the ring-radius ratios reach the screen.
function assignConcentric(g: Graph) {
  const nodesByDegree = g
    .nodes()
    .map((node) => ({ node, degree: g.degree(node) }))
    .sort((a, b) => b.degree - a.degree);

  let maxDegree = 0;
  for (const { degree } of nodesByDegree) {
    if (degree > maxDegree) maxDegree = degree;
  }
  const levelWidth = Math.max(1, maxDegree / 4);

  // Walk nodes high→low degree; start a new (outer) level once a node's degree
  // falls a full levelWidth below the degree that opened the current level.
  // Track the opening degree in a variable rather than reading current[0] —
  // levels start empty at runtime, but TS (no noUncheckedIndexedAccess) types
  // the index as defined, so an index-based guard trips no-unnecessary-condition.
  const levels: { node: string; degree: number }[][] = [];
  let current: { node: string; degree: number }[] = [];
  let levelOpenDegree = 0;
  for (const entry of nodesByDegree) {
    if (current.length === 0) {
      levelOpenDegree = entry.degree;
      levels.push(current);
    } else if (Math.abs(levelOpenDegree - entry.degree) >= levelWidth) {
      current = [];
      levelOpenDegree = entry.degree;
      levels.push(current);
    }
    current.push(entry);
  }

  const minDist = 1;
  let r = 0;
  for (const level of levels) {
    const n = level.length;
    const dTheta = n > 1 ? (2 * Math.PI) / n : 0;
    if (n > 1) {
      const rMin = minDist / (2 * Math.sin(Math.PI / n));
      r = Math.max(rMin, r);
    }
    level.forEach(({ node }, i) => {
      const angle = i * dTheta;
      g.setNodeAttribute(node, "x", r * Math.cos(angle));
      g.setNodeAttribute(node, "y", r * Math.sin(angle));
    });
    r += minDist;
  }
}

// No graphology package implements a dagre-style layered layout, so this
// approximates it: rank each node by BFS depth from the graph's roots
// (in-degree 0, or the first node if the graph has none) and lay ranks out
// as horizontal rows — the same "layered" shape dagre produces, without a
// true dependency-ordering pass across ranks.
function bfsFrom(g: Graph, root: string, depth: Map<string, number>) {
  depth.set(root, 0);
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node === undefined) break;
    const d = depth.get(node) ?? 0;
    for (const neighbor of g.neighbors(node)) {
      if (!depth.has(neighbor)) {
        depth.set(neighbor, d + 1);
        queue.push(neighbor);
      }
    }
  }
}

// Real dagre runs crossing-minimization across the whole layered graph.
// This is the lazy one-pass stand-in: a top-down barycenter sweep (classic
// Sugiyama heuristic) — each rank reorders itself by the average position of
// its neighbors in the already-placed rank above, pulling connected nodes
// into vertical alignment instead of leaving them in arbitrary BFS-visit
// order. One pass, not iterated to convergence — catches most of the benefit
// for the mostly-shallow (2-3 rank) PPI graphs this renders.
function orderRanksByBarycenter(ranks: number[], nodesByRank: Map<number, string[]>, g: Graph) {
  const positionInRank = new Map<string, number>();
  ranks.forEach((rank) => {
    nodesByRank.get(rank)?.forEach((node, i) => positionInRank.set(node, i));
  });

  for (const rank of ranks.slice(1)) {
    const nodesInRank = nodesByRank.get(rank);
    if (!nodesInRank) continue;
    const barycenter = new Map<string, number>();
    nodesInRank.forEach((node) => {
      const neighborPositions = g
        .neighbors(node)
        .map((neighbor) => positionInRank.get(neighbor))
        .filter((pos): pos is number => pos !== undefined);
      const fallback = positionInRank.get(node) ?? 0;
      barycenter.set(
        node,
        neighborPositions.length > 0
          ? neighborPositions.reduce((sum, pos) => sum + pos, 0) / neighborPositions.length
          : fallback,
      );
    });
    nodesInRank.sort((a, b) => (barycenter.get(a) ?? 0) - (barycenter.get(b) ?? 0));
    nodesInRank.forEach((node, i) => positionInRank.set(node, i));
  }
}

function assignDagreLike(g: Graph) {
  const depth = new Map<string, number>();
  // The graph is typically disconnected into many small components (one per
  // interaction cluster), so BFS must restart from every unvisited node —
  // first from degree-0 roots (for a clean top rank), then from whatever is
  // left over (cycles with no in-degree-0 entry point).
  for (const root of g.filterNodes((node) => g.inDegree(node) === 0)) {
    if (!depth.has(root)) bfsFrom(g, root, depth);
  }
  g.forEachNode((node) => {
    if (!depth.has(node)) bfsFrom(g, node, depth);
  });

  // Most PPI components are a single 2-node pair, so a rank can hold hundreds
  // of nodes while the graph only has 2-3 ranks total — packing a rank into
  // one long row produces a hairline-thin band regardless of zoom. Wrap each
  // rank into its own square-ish sub-grid instead, and stack ranks vertically
  // by the tallest sub-grid seen so far, so every rank gets real vertical
  // thickness proportional to its width.
  const nodesByRank = new Map<number, string[]>();
  g.forEachNode((node) => {
    const rank = depth.get(node) ?? 0;
    const bucket = nodesByRank.get(rank);
    if (bucket) bucket.push(node);
    else nodesByRank.set(rank, [node]);
  });
  orderRanksByBarycenter(
    [...nodesByRank.keys()].sort((a, b) => a - b),
    nodesByRank,
    g,
  );
  const rankGap = 2;
  let yOffset = 0;
  for (const rank of [...nodesByRank.keys()].sort((a, b) => a - b)) {
    const rankNodes = nodesByRank.get(rank) ?? [];
    const perRow = Math.max(1, Math.ceil(Math.sqrt(rankNodes.length)));
    rankNodes.forEach((node, i) => {
      g.setNodeAttribute(node, "x", i % perRow);
      g.setNodeAttribute(node, "y", yOffset + Math.floor(i / perRow));
    });
    yOffset += Math.ceil(rankNodes.length / perRow) + rankGap;
  }
}

// Value at fraction q (0..1) of the sorted list — median at q=0.5. Used instead
// of max for component radii: a component with one long tail has a max radius far
// larger than its dense body, which would inflate spacing; a percentile ignores
// the tail.
function percentile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
}

// BFS every node once; the graph is mostly disconnected (one component per
// interaction cluster), so this yields the giant mesh plus hundreds of small
// pair/triangle components. Head cursor instead of Array.shift() to keep the
// giant component's BFS linear rather than O(n²).
function connectedComponents(g: Graph): string[][] {
  const seen = new Set<string>();
  const components: string[][] = [];
  g.forEachNode((start) => {
    if (seen.has(start)) return;
    const comp: string[] = [];
    const queue = [start];
    seen.add(start);
    let head = 0;
    while (head < queue.length) {
      const node = queue[head];
      head += 1;
      comp.push(node);
      for (const neighbor of g.neighbors(node)) {
        if (!seen.has(neighbor)) {
          seen.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    components.push(comp);
  });
  return components;
}

// Cose-Bilkent (the legacy renderer's layout) has no graphology port. What sets
// it apart from a plain force layout is that it separates the disconnected
// components: it force-directs the graph, then packs the components so they tile
// without overlap. Plain FA2 has no packing step, so on this mostly-disconnected
// PPI graph gravity collapses the giant component and flings the hundreds of
// small pair/triangle components into a lop-sided arc. We reproduce the legacy
// look — a dense giant mesh centred, with the small components scattered evenly
// in a disc around it — by force-directing for each component's internal shape,
// then repositioning component centroids: giant to the origin, the rest onto a
// phyllotaxis (sunflower) spiral.
function assignCoseBilkent(g: Graph) {
  forceAtlas2.assign(g, { iterations: 100, settings: { gravity: 1, scalingRatio: 10 } });

  const comps = connectedComponents(g).map((nodes) => {
    let sumX = 0;
    let sumY = 0;
    for (const node of nodes) {
      const attrs = g.getNodeAttributes(node);
      sumX += attrs.x as number;
      sumY += attrs.y as number;
    }
    const cx = sumX / nodes.length;
    const cy = sumY / nodes.length;
    let radius = 0;
    for (const node of nodes) {
      const attrs = g.getNodeAttributes(node);
      const d = Math.hypot((attrs.x as number) - cx, (attrs.y as number) - cy);
      if (d > radius) radius = d;
    }
    return { nodes, cx, cy, radius };
  });
  if (comps.length === 0) return;

  function placeComponent(comp: (typeof comps)[number], tx: number, ty: number) {
    const dx = tx - comp.cx;
    const dy = ty - comp.cy;
    for (const node of comp.nodes) {
      const attrs = g.getNodeAttributes(node);
      g.setNodeAttribute(node, "x", (attrs.x as number) + dx);
      g.setNodeAttribute(node, "y", (attrs.y as number) + dy);
    }
  }

  // Largest component (the giant mesh) anchors the centre; the rest tile around it.
  comps.sort((a, b) => b.nodes.length - a.nodes.length);
  const giant = comps[0];
  placeComponent(giant, 0, 0);

  const rest = comps.slice(1);
  if (rest.length === 0) return;

  // Inner hole = the giant's body radius, not its max radius: the giant has a
  // long thin tail whose max radius is far bigger than the dense core, and using
  // it leaves a wide empty annulus and pushes the halo out to a thin perimeter
  // ring. A percentile of node distances from the centroid tracks the body.
  const giantDists = giant.nodes.map((node) => {
    const attrs = g.getNodeAttributes(node);
    return Math.hypot((attrs.x as number) - giant.cx, (attrs.y as number) - giant.cy);
  });
  const innerRadius = percentile(giantDists, 0.9);

  // Spread the halo across a band as wide as the giant's body (inner→2·inner)
  // rather than packing at each component's own tiny footprint (pairs → area→0
  // → all collapse onto one ring). Derive the per-step area from that target
  // outer radius so the sunflower fills the band at uniform density.
  const outerRadius = innerRadius * 2 + (percentile(rest.map((c) => c.radius), 0.9) || 1);
  const ringArea = Math.PI * (outerRadius * outerRadius - innerRadius * innerRadius);
  const cellArea = ringArea / rest.length;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  rest.forEach((comp, i) => {
    // r = sqrt(inner² + i·area/π): golden-angle steps with radius growing as
    // sqrt(i) distribute points at uniform areal density (sunflower packing);
    // the inner² term keeps them clear of the central mesh.
    const r = Math.sqrt(innerRadius * innerRadius + ((i + 0.5) * cellArea) / Math.PI);
    const theta = i * goldenAngle;
    placeComponent(comp, r * Math.cos(theta), r * Math.sin(theta));
  });
}

function componentBox(g: Graph, nodes: string[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    const attrs = g.getNodeAttributes(node);
    const x = attrs.x as number;
    const y = attrs.y as number;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { nodes, minX, minY, width: maxX - minX, height: maxY - minY };
}

// Cola (the legacy renderer's other force layout) has no graphology port either,
// but its legacy look differs from cose-bilkent: the giant mesh sits as one big
// block up top, with the disconnected components laid out in tidy rows beneath
// it. Plain FA2 has no such separation — gravity collapses the giant and flings
// the small components into a sparse ring. We reproduce it: FA2 for each
// component's internal shape, then place the giant at top-left and grid the rest
// into uniform cells below (giant-width wide), so small components tile in even
// rows the way legacy cola packs disconnected components.
function assignCola(g: Graph) {
  forceAtlas2.assign(g, { iterations: 100, settings: { gravity: 1, scalingRatio: 10 } });

  const comps = connectedComponents(g).sort((a, b) => b.length - a.length);
  if (comps.length === 0) return;
  const boxes = comps.map((nodes) => componentBox(g, nodes));
  const giantBox = boxes[0];

  // Move a component so its top-left corner lands at (tx, ty). Coordinates here
  // are y-down (screen convention); a final pass flips y so the giant, built at
  // the top, actually renders on top in Sigma's y-up space.
  function place(box: (typeof boxes)[number], tx: number, ty: number) {
    const dx = tx - box.minX;
    const dy = ty - box.minY;
    for (const node of box.nodes) {
      const attrs = g.getNodeAttributes(node);
      g.setNodeAttribute(node, "x", (attrs.x as number) + dx);
      g.setNodeAttribute(node, "y", (attrs.y as number) + dy);
    }
  }

  place(giantBox, 0, 0);

  const restBoxes = boxes.slice(1);
  // Column count from the component *count*, not giant width / cell: small
  // components are tiny pairs, so giantWidth/cell would be thousands of columns
  // and pack everything into a single row. sqrt(n)·2 gives a wide landscape grid
  // (wider than tall) like legacy.
  const cols = Math.min(restBoxes.length, Math.max(1, Math.round(Math.sqrt(restBoxes.length) * 2)));
  // Cell size set so the grid spans ~1.2× the giant's width — wide, evenly spaced.
  const step = (giantBox.width * 1.2) / cols;
  // Each small component is scaled to fill this fraction of its cell. FA2 packs a
  // 2–4 node component into a near-zero footprint, so at full-graph zoom its nodes
  // merge into one dot and the edge disappears. Blowing every component up to the
  // same in-cell span makes the node-to-edge distance uniform and zoom-independent,
  // so connections stay visible however far out you zoom; the gap (1 − fill) keeps
  // adjacent components apart.
  const cellFill = 0.55;
  const rowsTop = giantBox.height + step; // first row sits a step below the giant
  restBoxes.forEach((box, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const target = step * cellFill;
    // Scale the component so its larger dimension spans `target`; singletons and
    // zero-height pairs (dim 0) fall back to no scaling.
    const scale = Math.max(box.width, box.height) > 0 ? target / Math.max(box.width, box.height) : 1;
    for (const node of box.nodes) {
      const attrs = g.getNodeAttributes(node);
      g.setNodeAttribute(node, "x", box.minX + ((attrs.x as number) - box.minX) * scale);
      g.setNodeAttribute(node, "y", box.minY + ((attrs.y as number) - box.minY) * scale);
    }
    const scaledBox = componentBox(g, box.nodes);
    // Centre the scaled component in its cell so rows stay aligned.
    const cellX = col * step + (step - scaledBox.width) / 2;
    const cellY = rowsTop + row * step + (step - scaledBox.height) / 2;
    place(scaledBox, cellX, cellY);
  });

  // Flip y: built top-down, but Sigma renders +y up, so negate so the giant
  // (top of the build) renders on top and the rows fall beneath it.
  g.forEachNode((node) => {
    g.setNodeAttribute(node, "y", -(g.getNodeAttribute(node, "y") as number));
  });
}

function runGraphLayout(g: Graph, name: LayoutName) {
  if (name === "circular") {
    // Large scale spreads the ~1,900 nodes far apart on the ring (default scale
    // is 1, which packs them into an unreadable overlapping circle).
    circular.assign(g, { scale: 100 });
    return;
  }
  if (name === "random") {
    random.assign(g);
    return;
  }
  if (name === "grid") {
    assignGrid(g);
    return;
  }
  if (name === "concentric") {
    assignConcentric(g);
    return;
  }
  if (name === "dagre") {
    assignDagreLike(g);
    return;
  }
  if (name === "cose-bilkent") {
    assignCoseBilkent(g);
    return;
  }
  if (name === "cola") {
    assignCola(g);
    return;
  }
  // "forceatlas2" resolves here — the plain graphology force layout, no
  // component packing.
  forceAtlas2.assign(g, { iterations: 100, settings: { gravity: 1, scalingRatio: 10 } });
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

function HandleBridge({ layout, handleRef }: { layout: LayoutName; handleRef: GraphCanvasProps["handleRef"] }) {
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

  void layout;
  return null;
}

export default function SigmaCanvas({ nodes, edges, layout, onSelect, handleRef }: GraphCanvasProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<"node" | "edge" | null>(null);

  return (
    <div className="relative size-full">
      <SigmaContainer style={{ width: "100%", height: "100%" }} settings={{ renderEdgeLabels: false, defaultEdgeType: "line" }}>
        <GraphLoader nodes={nodes} edges={edges} layout={layout} />
        <GraphEvents
          onSelect={onSelect}
          onHover={setTooltip}
          selectedId={selectedId}
          selectedKind={selectedKind}
          onSelectId={(id, kind) => { setSelectedId(id); setSelectedKind(kind); }}
        />
        <HandleBridge layout={layout} handleRef={handleRef} />
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
