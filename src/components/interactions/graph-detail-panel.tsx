import type { GEdge, GNode, GraphSelection } from "@/lib/interactions/types";

interface GraphDetailPanelProps {
  selection: GraphSelection;
  // Edges touching the selected node, so a keyboard user can reach an edge
  // (and its details) without clicking one on the canvas. Empty unless a single
  // node is selected.
  incidentEdges: GEdge[];
  nodesById: Map<string, GNode>;
  onSelectEdge: (edge: GEdge) => void;
}

function endpointLabel(nodesById: Map<string, GNode>, id: string): string {
  const n = nodesById.get(id);
  return n?.gene || id;
}

export function GraphDetailPanel({ selection, incidentEdges, nodesById, onSelectEdge }: GraphDetailPanelProps) {
  if (selection.nodes.length === 0 && selection.edges.length === 0) {
    return (
      <p className="p-3 text-sm text-muted-foreground">
        Select a node or edge to see details.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto p-3 text-sm">
      {selection.nodes.map((node) => (
        <div key={node.id} className="flex flex-col gap-2">
          <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
            <dt className="font-medium text-muted-foreground">BRC ID</dt>
            <dd className="break-all">{node.id}</dd>
            <dt className="font-medium text-muted-foreground">Genome</dt>
            <dd className="break-all">{node.genome || "—"}</dd>
            <dt className="font-medium text-muted-foreground">Locus tag</dt>
            <dd className="break-all">{node.refseqLocusTag || "—"}</dd>
            <dt className="font-medium text-muted-foreground">Gene</dt>
            <dd className="break-all">{node.gene || "—"}</dd>
            <dt className="font-medium text-muted-foreground">Product</dt>
            <dd className="break-all">{node.interactorDesc || "—"}</dd>
          </dl>
          {incidentEdges.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="font-medium text-muted-foreground">
                Interactions ({incidentEdges.length})
              </p>
              <ul className="flex flex-col gap-0.5">
                {incidentEdges.map((edge) => {
                  const otherId = edge.source === node.id ? edge.target : edge.source;
                  return (
                    <li key={edge.id}>
                      <button
                        type="button"
                        onClick={() => { onSelectEdge(edge); }}
                        className="w-full rounded px-2 py-1 text-left break-all hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                      >
                        {endpointLabel(nodesById, otherId)}
                        {edge.interactionType ? ` · ${edge.interactionType}` : ""}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      ))}
      {selection.edges.map((edge) => (
        <dl key={edge.id} className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
          <dt className="font-medium text-muted-foreground">From</dt>
          <dd className="break-all">{endpointLabel(nodesById, edge.source)}</dd>
          <dt className="font-medium text-muted-foreground">To</dt>
          <dd className="break-all">{endpointLabel(nodesById, edge.target)}</dd>
          <dt className="font-medium text-muted-foreground">Interaction type</dt>
          <dd className="break-all">{edge.interactionType || "—"}</dd>
          <dt className="font-medium text-muted-foreground">Detection method</dt>
          <dd className="break-all">{edge.detectionMethod || "—"}</dd>
          <dt className="font-medium text-muted-foreground">Evidence</dt>
          <dd className="break-all">{edge.evidence || "—"}</dd>
        </dl>
      ))}
    </div>
  );
}
