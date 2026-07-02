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
    <div className="flex h-full min-h-0 w-18 shrink-0 flex-col rounded-l-lg border-l bg-muted">
      {/* Top toggle button */}
      <div className="border-b p-2">
        {panelExpanded ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setPanelExpanded(false); }}
            title="Hide panel"
            className="flex h-auto w-full flex-col items-center gap-0 px-1 py-2"
          >
            <PanelRightClose className="size-4" />
            <span className="text-xs">Hide</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setPanelExpanded(true); }}
            title="Show panel"
            className="flex h-auto w-full flex-col items-center gap-0 px-1 py-2"
          >
            <PanelRightOpen className="size-4" />
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
    <div className="flex min-h-0 w-full flex-1 overflow-hidden">
      <ResizablePanelGroup orientation="horizontal" className="size-full min-h-0">
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
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
