"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

interface ResourceWorkspaceProps {
  children: ReactNode;
  sidePanel: ReactNode;
  actionBar?: ReactNode;
  hasSidePanel?: boolean;
}

const narrowWorkspaceQuery = "(max-width: 47.999rem)";

export function ResourceWorkspace({
  children,
  sidePanel,
  actionBar,
  hasSidePanel = true,
}: ResourceWorkspaceProps) {
  const [panelExpanded, setPanelExpanded] = useState(hasSidePanel);
  const [isNarrow, setIsNarrow] = useState(false);
  const [previousHasSidePanel, setPreviousHasSidePanel] =
    useState(hasSidePanel);
  if (previousHasSidePanel !== hasSidePanel) {
    setPreviousHasSidePanel(hasSidePanel);
    if (hasSidePanel) setPanelExpanded(true);
  }

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia(narrowWorkspaceQuery);
    const update = () => {
      setIsNarrow(mediaQuery.matches);
    };
    update();
    mediaQuery.addEventListener("change", update);
    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, []);

  const actionStrip = (
    <div className="flex h-full min-h-0 w-20 shrink-0 flex-col rounded-l-lg border-l bg-muted max-md:h-auto max-md:w-full max-md:flex-row max-md:rounded-l-none max-md:border-t max-md:border-l-0">
      <div className="border-b p-2 max-md:border-r max-md:border-b-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setPanelExpanded((current) => !current);
          }}
          title={panelExpanded ? "Hide panel" : "Show panel"}
          className="flex h-auto w-full flex-col items-center gap-0 px-1 py-2 max-md:w-16"
        >
          {panelExpanded ? (
            <PanelRightClose className="size-4" />
          ) : (
            <PanelRightOpen className="size-4" />
          )}
          <span className="text-xs">{panelExpanded ? "Hide" : "Show"}</span>
        </Button>
      </div>
      <div className="scrollbar-themed min-h-0 flex-1 overflow-y-auto px-1.5 py-2 max-md:flex">
        {actionBar}
      </div>
    </div>
  );

  if (isNarrow) {
    return (
      <div
        data-layout="stacked"
        className="flex min-h-0 w-full flex-1 flex-col overflow-hidden"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
        <aside className="shrink-0">{actionStrip}</aside>
        {hasSidePanel && panelExpanded && (
          <aside className="max-h-[45%] min-h-40 shrink-0 overflow-auto border-t bg-background shadow-[0_-8px_24px_-16px_rgb(0_0_0/0.5)]">
            {sidePanel}
          </aside>
        )}
      </div>
    );
  }

  return (
    <div
      data-layout="resizable"
      className="flex min-h-0 w-full flex-1 overflow-hidden"
    >
      <ResizablePanelGroup
        orientation="horizontal"
        className="size-full min-h-0"
      >
        <ResizablePanel
          minSize="20%"
          className="flex min-h-0 min-w-0 overflow-hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
          <aside className="shrink-0">{actionStrip}</aside>
        </ResizablePanel>
        {hasSidePanel && panelExpanded && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize="15%"
              minSize="10%"
              maxSize="60%"
              className="relative min-h-0 overflow-hidden"
            >
              <div className="absolute inset-0 flex flex-col overflow-hidden border-t">
                {sidePanel}
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
