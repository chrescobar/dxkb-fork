"use client";

import { use, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, Cuboid } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { getProxyUrl } from "@/components/workspace/file-viewer/file-viewer-registry";

type ViewerStatus = "loading" | "initializing" | "ready" | "error";

interface StructurePageProps {
  params: Promise<{ path?: string[] }>;
}

export default function StructureViewerPage({ params }: StructurePageProps) {
  const { path } = use(params);
  const filePath = path ? `/${path.map(decodeURIComponent).join("/")}` : "";
  const fileName = filePath ? filePath.split("/").pop() ?? "" : "";

  const containerRef = useRef<HTMLDivElement>(null);
  const pluginRef = useRef<{ dispose: (opts?: object) => void } | null>(null);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    if (!filePath) return;

    let disposed = false;

    async function init() {
      if (!containerRef.current) return;

      try {
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

        // Full viewer with all panels and controls enabled.
        const spec = {
          ...DefaultPluginUISpec(),
          layout: {
            initial: {
              isExpanded: false,
              showControls: true,
              controlsDisplay: "reactive" as const,
              regionState: {
                left: "full" as const,
                top: "full" as const,
                right: "full" as const,
                bottom: "full" as const,
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

  // Keep the WebGL canvas in sync with viewport size changes.
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
    observer.observe(container);

    rafId = requestAnimationFrame(syncSize);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [status]);

  if (!filePath) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No file path provided.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header bar */}
      <div className="flex shrink-0 items-center gap-3 px-4 py-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              window.close();
            }
          }}
          title="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex items-center gap-2 overflow-hidden">
          <Cuboid className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">{fileName}</span>
        </div>
      </div>

      <Separator />

      {/* Viewer area */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={containerRef}
          className="h-full w-full"
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
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background">
            <div className="flex flex-col items-center gap-2 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="max-w-sm text-sm text-muted-foreground">
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
    </div>
  );
}
