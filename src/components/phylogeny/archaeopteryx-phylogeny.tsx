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
    let resizeFrame: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
      });
    });
    resizeObserver.observe(host);

    const render = async () => {
      setStatus(undefined);
      host.replaceChildren();

      const { archaeopteryx, forester } = await loadArchaeopteryx();
      if (cancelled) return;

      const tree = archaeopteryx.parsePhyloXML(xml);
      const nodeLabels = Object.fromEntries(
        Array.from(forester.collectPropertyRefs(tree, "node", false)).map(
          (ref) => {
            const key = ref.replace(/^.*:/, "");
            const label = key
              .replaceAll(/[_-]+/g, " ")
              .replace(/\b\w/g, (character) => character.toUpperCase());
            return [
              key,
              {
                label,
                propertyRef: ref,
                description: `the ${label}`,
                showButton: true,
              },
            ];
          },
        ),
      );
      const labelFontSize = 10;
      const options: Record<string, unknown> = {
        backgroundColorDefault: "#ffffff",
        branchColorDefault: "#64748b",
        labelColorDefault: "#0f172a",
        externalNodeFontSize: labelFontSize,
        internalNodeFontSize: labelFontSize,
        branchDataFontSize: labelFontSize,
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
      };
      const settings: Record<string, unknown> = {
        allowManualNodeSelection: selectable,
        controls0: `${id}-controls-primary`,
        controls1: `${id}-controls-secondary`,
        controlsBackgroundColor: "var(--popover)",
        controlsFontColor: "var(--popover-foreground)",
        controlsFont: ["var(--font-geist-sans)", "sans-serif"],
        controlsFontSize: 11,
        searchFieldWidth: "9rem",
        dynamicallyAddNodeVisualizations: true,
        enableAccessToDatabases: false,
        enableBranchVisualizations: true,
        enableDownloads: true,
        enableDynamicSizing: true,
        enableNodeVisualizations: true,
        enableSubtreeDeletion: false,
        showBranchColorsButton: false,
        zoomToFitUponWindowResize: true,
      };
      archaeopteryx.launch(`#${id}`, tree, options, settings, {}, nodeLabels);

      const primaryControls = document.getElementById(`${id}-controls-primary`);
      const secondaryControls = document.getElementById(
        `${id}-controls-secondary`,
      );
      if (primaryControls && secondaryControls) {
        settings.rootOffset = primaryControls.offsetWidth + 34;
        options.visualizationsLegendXpos = primaryControls.offsetWidth + 34;
        options.visualizationsLegendXposOrig = options.visualizationsLegendXpos;
        host.style.width = `calc(100% - ${String(secondaryControls.offsetWidth + 12)}px)`;
        document
          .getElementById("zoomtofit")
          ?.dispatchEvent(new Event("mousedown"));
      }

      setStatus(null);
    };

    const selectionChanged = () => {
      void loadArchaeopteryx().then(({ archaeopteryx }) => {
        if (!cancelled)
          handleSelect(archaeopteryx.getSelectedNodes().at(-1) ?? null);
      });
    };

    if (selectable)
      document.addEventListener(
        "selected_nodes_changed_event",
        selectionChanged,
      );
    void render().catch((cause: unknown) => {
      if (!cancelled) {
        setStatus(
          cause instanceof Error
            ? cause.message
            : "The tree could not be rendered.",
        );
      }
    });

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      if (selectable)
        document.removeEventListener(
          "selected_nodes_changed_event",
          selectionChanged,
        );
      void loadArchaeopteryx().then(({ archaeopteryx }) => {
        archaeopteryx.destroy();
      });
    };
  }, [id, selectable, xml]);

  if (status) {
    return (
      <div className="grid h-full min-h-64 place-items-center p-6 text-center">
        <div>
          <h2 className="font-semibold text-destructive">
            Phylogeny renderer unavailable
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{status}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="archaeopteryx-dxkb relative h-full min-h-0 overflow-auto bg-background">
      {status === undefined && (
        <div className="absolute inset-0 z-10 bg-background">
          <ArchaeopteryxLoading />
        </div>
      )}
      <div
        id={id}
        ref={hostRef}
        className="size-full min-h-[40rem] min-w-0"
        role="img"
        aria-label={`Interactive phylogenetic tree for ${title}`}
      />
      <div id={`${id}-controls-primary`} />
      <div id={`${id}-controls-secondary`} />
    </div>
  );
}
