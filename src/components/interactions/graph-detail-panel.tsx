import type { GraphSelection } from "@/lib/interactions/types";

interface GraphDetailPanelProps {
  selection: GraphSelection;
}

export function GraphDetailPanel({ selection }: GraphDetailPanelProps) {
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
        <dl key={node.id} className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
          <dt className="font-medium text-muted-foreground">BRC ID</dt>
          <dd className="break-all">{node.id}</dd>
          <dt className="font-medium text-muted-foreground">Genome</dt>
          <dd className="break-all">{node.genome ?? "—"}</dd>
          <dt className="font-medium text-muted-foreground">Locus tag</dt>
          <dd className="break-all">{node.refseqLocusTag ?? "—"}</dd>
          <dt className="font-medium text-muted-foreground">Gene</dt>
          <dd className="break-all">{node.gene ?? "—"}</dd>
          <dt className="font-medium text-muted-foreground">Product</dt>
          <dd className="break-all">{node.interactorDesc ?? "—"}</dd>
        </dl>
      ))}
      {selection.edges.map((edge) => (
        <dl key={edge.id} className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
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
