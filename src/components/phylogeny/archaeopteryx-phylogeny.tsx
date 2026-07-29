"use client";

import { useEffect, useEffectEvent, useId, useRef, useState } from "react";

import {
  loadArchaeopteryx,
  type ArchaeopteryxNode,
} from "@/lib/phylogeny/archaeopteryx";

import { ArchaeopteryxLoading } from "./archaeopteryx-loading";

interface ArchaeopteryxPhylogenyProps {
  xml: string;
  title: string;
  selectable?: boolean;
  onSelect?: (node: ArchaeopteryxNode | null) => void;
}

export function ArchaeopteryxPhylogeny({
  xml,
  title,
  selectable = false,
  onSelect,
}: ArchaeopteryxPhylogenyProps) {
  const id = `archaeopteryx-${useId().replaceAll(":", "")}`;
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string | null | undefined>(undefined);
  const handleSelect = useEffectEvent((node: ArchaeopteryxNode | null) => {
    onSelect?.(node);
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    const render = async () => {
      setStatus(undefined);
      host.replaceChildren();

      const archaeopteryx = await loadArchaeopteryx();
      if (cancelled) return;

      const tree = archaeopteryx.parsePhyloXML(xml);
      archaeopteryx.launch(`#${id}`, tree, {
        backgroundColorDefault: "#ffffff",
        branchColorDefault: "#64748b",
        labelColorDefault: "#0f172a",
        externalNodeFontSize: 10,
        internalNodeFontSize: 8,
        showConfidenceValues: true,
        showNodeName: true,
        showTaxonomyScientificName: true,
        showNodeVisualizations: true,
        // ponytail: matches legacy OutbreaksPhylogenyTreeViewer.js viral defaults;
        // archaeopteryx no-ops if the tree lacks these properties.
        ...(!selectable && {
          initialLabelColorVisualization: "Year",
          initialNodeFillColorVisualization: "Host",
        }),
      }, {
        allowManualNodeSelection: selectable,
        controls0: `${id}-controls-primary`,
        controls1: `${id}-controls-secondary`,
        dynamicallyAddNodeVisualizations: true,
        enableAccessToDatabases: false,
        enableDownloads: false,
        enableDynamicSizing: true,
        enableNodeVisualizations: true,
        enableSubtreeDeletion: false,
        showBranchColorsButton: false,
        zoomToFitUponWindowResize: true,
      }, {});

      setStatus(null);
    };

    const selectionChanged = () => {
      void loadArchaeopteryx().then(archaeopteryx => {
        if (!cancelled) handleSelect(archaeopteryx.getSelectedNodes().at(-1) ?? null);
      });
    };

    if (selectable) document.addEventListener("selected_nodes_changed_event", selectionChanged);
    void render().catch((cause: unknown) => {
      if (!cancelled) {
        setStatus(cause instanceof Error ? cause.message : "The tree could not be rendered.");
      }
    });

    return () => {
      cancelled = true;
      if (selectable) document.removeEventListener("selected_nodes_changed_event", selectionChanged);
      void loadArchaeopteryx().then(archaeopteryx => { archaeopteryx.destroy(); });
    };
  }, [id, selectable, xml]);

  if (status) {
    return (
      <div className="grid h-full min-h-64 place-items-center p-6 text-center">
        <div>
          <h2 className="font-semibold text-destructive">Phylogeny renderer unavailable</h2>
          <p className="mt-1 text-sm text-muted-foreground">{status}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="archaeopteryx-dxkb relative h-full min-h-0 overflow-auto bg-background">
      {status === undefined && <div className="absolute inset-0 z-10 bg-background"><ArchaeopteryxLoading /></div>}
      <div
        id={id}
        ref={hostRef}
        className="min-h-[40rem] min-w-3xl"
        role="img"
        aria-label={`Interactive phylogenetic tree for ${title}`}
      />
      <div id={`${id}-controls-primary`} />
      <div id={`${id}-controls-secondary`} />
    </div>
  );
}
