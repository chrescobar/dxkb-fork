"use client";

import { useState, type ReactNode } from "react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { Button } from "@/components/ui/button";

import { PanelRightClose, PanelRightOpen } from "lucide-react";

interface GenomeShellProps {
  children: ReactNode;
  sidePanel: ReactNode;
  actionBar?: ReactNode;
  hasSidePanel?: boolean;
}

export function GenomeShell({
  children,
  sidePanel,
  actionBar,
  hasSidePanel = true,
}: GenomeShellProps) {
  // Initialize open when a side panel item is active; don't auto-close on deselect
  // so the user's manual toggle is respected.
  const [panelExpanded, setPanelExpanded] = useState(hasSidePanel);
  const [prevHasSidePanel, setPrevHasSidePanel] = useState(hasSidePanel);
  if (prevHasSidePanel !== hasSidePanel) {
    setPrevHasSidePanel(hasSidePanel);
    if (hasSidePanel) {
      setPanelExpanded(true);
    }
  }

  const actionStrip = (
    <div className="bg-muted flex flex-col w-[72px] shrink-0 border-l min-h-0 h-full">
      {/* Top toggle button */}
      <div className="border-b p-2">
        {panelExpanded ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPanelExpanded(false)}
            title="Hide panel"
            className="flex flex-col items-center gap-0 h-auto py-2 px-1 w-full"
          >
            <PanelRightClose className="h-4 w-4" />
            <span className="text-xs">Hide</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPanelExpanded(true)}
            title="Show panel"
            className="flex flex-col items-center gap-0 h-auto py-2 px-1 w-full"
          >
            <PanelRightOpen className="h-4 w-4" />
            <span className="text-xs">Show</span>
          </Button>
        )}
      </div>

      <div className="scrollbar-themed min-h-0 flex-1 overflow-y-auto px-1.5 py-2">
        {actionBar}
      </div>
    </div>
  );

  return (
    <div className="flex-1 min-h-0 w-full flex overflow-hidden">
      <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0 w-full">
        {/*
          The first panel is always mounted so children (the data table) never
          remounts and TanStack Query never re-fires on panel open/close.
          The second panel is conditionally rendered; when absent the first
          panel naturally fills 100% of the group with no flash.
        */}
        <ResizablePanel
          minSize="20%"
          className="flex min-h-0 min-w-0 overflow-hidden"
        >
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {children}
          </div>

          <aside className="shrink-0">
            {actionStrip}
          </aside>
        </ResizablePanel>

        {panelExpanded && (
          <>
            <ResizableHandle withHandle />

            <ResizablePanel
              defaultSize={20}
              minSize="20%"
              maxSize="60%"
              className="relative min-h-0 overflow-hidden"
            >
              {/* absolute inset-0 breaks the h-full chain dependency */}
              <div className="absolute inset-0 flex flex-col overflow-hidden">
                {sidePanel}
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
