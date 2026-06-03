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
    <div className="bg-muted/30 flex flex-col w-[72px] shrink-0 border-l min-h-0">
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

  if (!panelExpanded) {
    return (
      <div className="flex-1 min-h-0 w-full overflow-hidden flex">
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {children}
        </div>

        <aside className="shrink-0">
          {actionStrip}
        </aside>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 w-full flex overflow-hidden">
      {/* Remount the group whenever panelExpanded or hasSidePanel changes so
          default sizes are applied consistently (avoids the 0->small size
          when toggling visibility). */}
      <ResizablePanelGroup
        key={`resizable-${panelExpanded}-${hasSidePanel}`}
        orientation="horizontal"
        className="h-full min-h-0 w-full"
      >
        <ResizablePanel
          defaultSize={80}
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

        <ResizableHandle withHandle />

        <ResizablePanel
          defaultSize={20}
          minSize="20%"
          maxSize="60%"
          className="relative min-h-0 overflow-hidden"
        >
          {/* absolute inset-0 breaks the h-full chain dependency — the panel's
              flex-computed bounds become the containing block, so DetailPanel's
              h-full resolves without needing a definite height all the way up. */}
          <div className="absolute inset-0 flex flex-col overflow-hidden">
            {sidePanel}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}