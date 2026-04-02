"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getProxyUrl } from "../file-viewer-registry";
import { ExpandableViewerWrapper } from "./expandable-viewer-wrapper";

type ViewerStatus = "loading" | "initializing" | "ready" | "error";

interface StructureViewerProps {
  filePath: string;
  fileName: string;
}

export function StructureViewer({ filePath, fileName }: StructureViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pluginRef = useRef<{ dispose: (opts?: object) => void } | null>(null);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    let disposed = false;

    async function init() {
      if (!containerRef.current) return;

      try {
        // Dynamically import Mol* modules — keeps the ~5MB bundle out of the
        // main chunk and avoids SSR issues (WebGL requires a DOM).
        const [{ createPluginUI }, { renderReact18 }, { DefaultPluginUISpec }] =
          await Promise.all([
            import("molstar/lib/mol-plugin-ui"),
            import("molstar/lib/mol-plugin-ui/react18"),
            import("molstar/lib/mol-plugin-ui/spec"),
          ]);

        // Import Mol* base skin (theme overrides are in globals.css).
        await import("molstar/lib/mol-plugin-ui/skin/light.scss");

        if (disposed) return;
        setStatus("initializing");

        // Embedded preview: hide all Molstar chrome, canvas only.
        const spec = {
          ...DefaultPluginUISpec(),
          layout: {
            initial: {
              isExpanded: false,
              showControls: false,
              controlsDisplay: "reactive" as const,
              regionState: {
                left: "hidden" as const,
                top: "hidden" as const,
                right: "hidden" as const,
                bottom: "hidden" as const,
              },
            },
          },
          components: {
            remoteState: "none" as const,
          },
        };

        const plugin = await createPluginUI({
          target: containerRef.current,
          render: renderReact18,
          spec,
        });

        if (disposed) {
          plugin.dispose();
          return;
        }

        pluginRef.current = plugin;

        // Load the PDB file from the authenticated proxy URL.
        const url = getProxyUrl(filePath);
        const data = await plugin.builders.data.download(
          { url, isBinary: false },
          { state: { isGhost: true } },
        );
        const trajectory = await plugin.builders.structure.parseTrajectory(
          data,
          "pdb",
        );
        await plugin.builders.structure.hierarchy.applyPreset(
          trajectory,
          "default",
        );

        if (disposed) return;
        setStatus("ready");
      } catch (err) {
        if (disposed) return;
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load structure",
        );
        setStatus("error");
      }
    }

    init();

    return () => {
      disposed = true;
      pluginRef.current?.dispose();
      pluginRef.current = null;
    };
  }, [filePath]);

  // Sync canvas buffer to display size using the pattern from
  // webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html:
  // the ResizeObserver only *records* the target device-pixel size;
  // the rAF loop *applies* it so resize + Mol* render are atomic.
  // No CSS overrides on the canvas — Molstar manages its own sizing.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || status !== "ready") return;

    let resizePending = false;
    let rafId = 0;

    function syncSize() {
      if (resizePending) {
        resizePending = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (pluginRef.current as any)?.canvas3d?.handleResize();
      }
      rafId = requestAnimationFrame(syncSize);
    }

    const observer = new ResizeObserver(() => {
      resizePending = true;
    });

    try {
      // device-pixel-content-box gives exact device-pixel dimensions,
      // avoiding rounding errors from clientWidth * devicePixelRatio.
      observer.observe(container, {
        box: "device-pixel-content-box" as ResizeObserverBoxOptions,
      });
    } catch {
      observer.observe(container);
    }

    rafId = requestAnimationFrame(syncSize);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [status]);

  return (
    <ExpandableViewerWrapper title={fileName}>
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-b-lg">
        <div
          ref={containerRef}
          className="isolate relative min-h-0 flex-1 overflow-hidden"
          data-testid="molstar-container"
        />
        {(status === "loading" || status === "initializing") && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
            <Spinner className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {status === "loading"
                ? "Loading viewer\u2026"
                : "Initializing structure\u2026"}
            </p>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background">
            <div className="flex flex-col items-center gap-2 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="max-w-xs text-sm text-muted-foreground">
                {errorMessage}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatus("loading");
                setErrorMessage(undefined);
              }}
            >
              Retry
            </Button>
          </div>
        )}
      </div>
    </ExpandableViewerWrapper>
  );
}
