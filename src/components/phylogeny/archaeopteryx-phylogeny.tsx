"use client";

import { useEffect, useEffectEvent, useId, useRef, useState } from "react";

import {
  loadArchaeopteryx,
  type ArchaeopteryxApi,
  type ArchaeopteryxNode,
} from "@/lib/phylogeny/archaeopteryx";

import { ArchaeopteryxLoading } from "./archaeopteryx-loading";

// Mirrors the breakpoint in archaeopteryx-theme.css that stacks the controls.
const stackedControlsQuery = "(max-width: 640px)";

function subscribeMediaQuery(
  mediaQuery: MediaQueryList,
  listener: () => void,
): () => void {
  mediaQuery.addEventListener("change", listener);
  return () => {
    mediaQuery.removeEventListener("change", listener);
  };
}

function subscribeSelectionChange(listener: () => void): () => void {
  document.addEventListener("selected_nodes_changed_event", listener);
  return () => {
    document.removeEventListener("selected_nodes_changed_event", listener);
  };
}

function getThemeColors(host: HTMLElement) {
  const theme = getComputedStyle(document.documentElement);
  const themeColor = (property: string) =>
    theme.getPropertyValue(property).trim();
  const colorProbe = document.createElement("div");
  colorProbe.style.backgroundColor = `color-mix(in oklab, ${themeColor("--input")} 30%, ${themeColor("--card")})`;
  colorProbe.style.color = themeColor("--foreground");
  host.append(colorProbe);
  const probeStyle = getComputedStyle(colorProbe);
  const colors = {
    backgroundColor: probeStyle.backgroundColor,
    labelColor: probeStyle.color,
  };
  colorProbe.remove();
  return colors;
}

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
  const rendererRef = useRef<ArchaeopteryxApi>(null);
  const [status, setStatus] = useState<string | null | undefined>(undefined);
  const handleSelect = useEffectEvent((node: ArchaeopteryxNode | null) => {
    onSelect?.(node);
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let tornDown = false;
    let destroyRenderer: (() => void) | null = null;
    let resizeFrame: number | null = null;
    let removeMediaQueryListener: () => void = () => undefined;
    let removeSelectionListener: () => void = () => undefined;
    let updateLayout: () => void = () => undefined;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        updateLayout();
        window.dispatchEvent(new Event("resize"));
      });
    });
    resizeObserver.observe(host);

    const teardown = () => {
      if (tornDown) return;
      tornDown = true;
      rendererRef.current = null;
      resizeObserver.disconnect();
      removeMediaQueryListener();
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      removeSelectionListener();
      destroyRenderer?.();
    };

    const render = async () => {
      setStatus(undefined);
      host.replaceChildren();

      const { archaeopteryx, forester } = await loadArchaeopteryx();
      if (cancelled) return;
      destroyRenderer = () => {
        archaeopteryx.destroy(`#${id}`);
      };

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
      const { backgroundColor, labelColor } = getThemeColors(host);
      const labelFontSize = 10;
      const options: Record<string, unknown> = {
        backgroundColorDefault: backgroundColor,
        branchColorDefault: "#737373",
        labelColorDefault: labelColor,
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
      rendererRef.current = archaeopteryx;

      const primaryControls = document.getElementById(`${id}-controls-primary`);
      const secondaryControls = document.getElementById(
        `${id}-controls-secondary`,
      );
      const rootOffset = settings.rootOffset;
      const visualizationsLegendXpos = options.visualizationsLegendXpos;
      const visualizationsLegendXposOrig = options.visualizationsLegendXposOrig;
      const mediaQuery = window.matchMedia(stackedControlsQuery);
      // Below stackedControlsQuery, archaeopteryx-theme.css stacks the controls under
      // the canvas instead of floating them over it, so the tree needs no side offset.
      updateLayout = () => {
        if (primaryControls && secondaryControls && !mediaQuery.matches) {
          const primaryRight =
            primaryControls.offsetLeft + primaryControls.offsetWidth;
          settings.rootOffset = primaryRight + 14;
          options.visualizationsLegendXpos = primaryRight + 14;
          options.visualizationsLegendXposOrig =
            options.visualizationsLegendXpos;
          host.style.width = `calc(100% - ${String(secondaryControls.offsetWidth + 12)}px)`;
        } else {
          settings.rootOffset = rootOffset;
          options.visualizationsLegendXpos = visualizationsLegendXpos;
          options.visualizationsLegendXposOrig = visualizationsLegendXposOrig;
          host.style.width = "100%";
        }
        document
          .getElementById("zoomtofit")
          ?.dispatchEvent(new Event("mousedown"));
      };
      removeMediaQueryListener = subscribeMediaQuery(mediaQuery, updateLayout);
      updateLayout();

      setStatus(null);
    };

    const selectionChanged = () => {
      void loadArchaeopteryx().then(({ archaeopteryx }) => {
        if (cancelled) return;
        const node = archaeopteryx.getSelectedNodes().at(-1);
        const isLeaf = !node?.children?.length && !node?._children?.length;
        handleSelect(isLeaf ? (node ?? null) : null);
      });
    };

    if (selectable) {
      removeSelectionListener = subscribeSelectionChange(selectionChanged);
    }
    void render().catch((cause: unknown) => {
      if (!cancelled) {
        teardown();
        setStatus(
          cause instanceof Error
            ? cause.message
            : "The tree could not be rendered.",
        );
      }
    });

    return () => {
      cancelled = true;
      teardown();
    };
  }, [id, selectable, xml]);

  useEffect(() => {
    let themeFrame: number | null = null;
    const updateTheme = () => {
      if (themeFrame !== null) cancelAnimationFrame(themeFrame);
      themeFrame = requestAnimationFrame(() => {
        const host = hostRef.current;
        const renderer = rendererRef.current;
        if (!host || !renderer) return;
        const { backgroundColor, labelColor } = getThemeColors(host);
        renderer.setTheme(backgroundColor, labelColor);
      });
    };
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      observer.disconnect();
      if (themeFrame !== null) cancelAnimationFrame(themeFrame);
    };
  }, []);

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
        className="size-full min-h-160 min-w-0"
        role="img"
        aria-label={`Interactive phylogenetic tree for ${title}`}
      />
      <div id={`${id}-controls-primary`} />
      <div id={`${id}-controls-secondary`} />
    </div>
  );
}
