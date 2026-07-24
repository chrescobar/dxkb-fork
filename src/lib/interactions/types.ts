import type { RefObject } from "react";

export interface PpiRecord {
  id: string;
  interactor_a: string;
  interactor_b: string;
  interactor_type_a?: string;
  interactor_type_b?: string;
  interactor_desc_a?: string;
  interactor_desc_b?: string;
  feature_id_a?: string;
  feature_id_b?: string;
  gene_a?: string;
  gene_b?: string;
  genome_name_a?: string;
  genome_name_b?: string;
  refseq_locus_tag_a?: string;
  refseq_locus_tag_b?: string;
  domain_a?: string;
  domain_b?: string;
  evidence?: string | string[];
  interaction_type?: string | string[];
  detection_method?: string | string[];
}

export interface GNode {
  id: string;
  interactorType?: string;
  interactorDesc?: string;
  featureId?: string;
  gene?: string;
  genome?: string;
  refseqLocusTag?: string;
  kind: "microbial" | "host";
}

export interface GEdge {
  id: string;
  source: string;
  target: string;
  evidence: string;
  interactionType: string;
  detectionMethod: string;
  experimental: boolean;
}

export type LayoutName =
  | "cola"
  | "cose-bilkent"
  | "dagre"
  | "grid"
  | "concentric"
  | "random"
  | "forceatlas2"
  | "circular";

export interface GraphSelection {
  nodes: GNode[];
  edges: GEdge[];
}

export interface GraphCanvasHandle {
  runLayout: (name: LayoutName) => void;
  exportPng: () => void;
}

export interface GraphCanvasProps {
  nodes: GNode[];
  edges: GEdge[];
  layout: LayoutName;
  // Controlled selection: the canvas highlight reducer reads this so keyboard
  // selection (node list / edge list) highlights the same node/edge a canvas
  // click would. onSelect reports selections back out.
  selection: GraphSelection;
  onSelect: (sel: GraphSelection) => void;
  handleRef: RefObject<GraphCanvasHandle | null>;
  onReady?: () => void;
}
