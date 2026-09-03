"use client";

import { useEffect, useRef, useState } from "react";
import "molstar/lib/mol-plugin-ui/skin/light.scss";

import type { StructureSource } from "@/lib/protein-structure-view/source";
import { loadMolstar } from "./molstar-loader";

export type ViewerStatus = "loading" | "initializing" | "ready" | "error";

export interface MolstarLayoutSpec {
  showControls: boolean;
  regionState: "full" | "hidden";
}

export interface UseMolstarPluginResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  status: ViewerStatus;
  errorMessage: string | undefined;
  resetError: () => void;
}

/**
 * Shared hook that initialises a Mol* plugin inside the given container,
 * loads a resolved structure source, and keeps the WebGL canvas in sync with
 * resize events.
 *
 * Both the dedicated viewer page and the embedded preview component use this
 * hook - the only difference is the `layout` spec (full panels vs. hidden).
 */
export function useMolstarPlugin(
  source: StructureSource,
  layout: MolstarLayoutSpec,
): UseMolstarPluginResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const pluginRef = useRef<{ dispose: (opts?: object) => void } | null>(null);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // `isDisposed` reads through a function call so TypeScript cannot narrow the
    // return value to `false` after a guard — the cleanup callback can set it to
    // `true` at any await boundary and all subsequent checks are genuinely needed.
    const lifecycle = { disposed: false };
    const isDisposed = (): boolean => lifecycle.disposed;

    async function init() {
      setStatus("loading");
      setErrorMessage(undefined);

      if (!source.url || !containerRef.current) return;

      try {
        const { createPluginUI, renderReact18, DefaultPluginUISpec } =
          await loadMolstar();

        if (isDisposed()) return;
        setStatus("initializing");

        const spec = {
          ...DefaultPluginUISpec(),
          layout: {
            initial: {
              isExpanded: false,
              showControls: layout.showControls,
              controlsDisplay: "reactive" as const,
              regionState: {
                left: layout.regionState,
                top: layout.regionState,
                right: layout.regionState,
                bottom: layout.regionState,
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

        if (isDisposed()) {
          plugin.dispose();
          return;
        }

        pluginRef.current = plugin;

        const isBinary = source.format === "bcif";
        const format = source.format === "bcif" ? "mmcif" : source.format;
        const data = await plugin.builders.data.download(
          { url: source.url, isBinary },
          { state: { isGhost: true } },
        );
        const trajectory = await plugin.builders.structure.parseTrajectory(
          data,
          format,
        );
        await plugin.builders.structure.hierarchy.applyPreset(
          trajectory,
          "default",
        );

        if (isDisposed()) return;
        setStatus("ready");
      } catch (err) {
        if (isDisposed()) return;
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load structure",
        );
        setStatus("error");
      }
    }

    void init();

    return () => {
      lifecycle.disposed = true;
      pluginRef.current?.dispose();
      pluginRef.current = null;
    };
  }, [
    source.url,
    source.format,
    layout.showControls,
    layout.regionState,
    retryCount,
  ]);

  const isReady = status === "ready";
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isReady) return;

    let rafId = 0;

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        (
          pluginRef.current as {
            canvas3d?: { handleResize?: () => void };
          } | null
        )?.canvas3d?.handleResize?.();
      });
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

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [isReady]);

  const resetError = () => {
    setErrorMessage(undefined);
    setRetryCount((c) => c + 1);
  };

  return { containerRef, status, errorMessage, resetError };
}
