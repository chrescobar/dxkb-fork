"use client";

import type { StructureSource } from "@/lib/protein-structure-view/source";
import { getProxyUrl } from "../file-viewer-registry";
import { ExpandableViewerWrapper } from "./expandable-viewer-wrapper";
import { StructureSourceViewer } from "./structure-source-viewer";
import type { MolstarLayoutSpec } from "./use-molstar-plugin";

interface StructureViewerProps {
  filePath: string;
  fileName: string;
}

const embeddedLayout: MolstarLayoutSpec = {
  showControls: false,
  regionState: "hidden",
};

export function StructureViewer({ filePath, fileName }: StructureViewerProps) {
  const source: StructureSource = {
    url: getProxyUrl(filePath),
    format: "pdb",
    label: fileName,
    kind: "workspace",
  };
  return (
    <ExpandableViewerWrapper title={fileName}>
      <div className="relative flex size-full flex-col overflow-hidden rounded-b-lg">
        <StructureSourceViewer
          source={source}
          layout={embeddedLayout}
          compact
        />
      </div>
    </ExpandableViewerWrapper>
  );
}
