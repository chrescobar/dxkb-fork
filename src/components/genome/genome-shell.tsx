"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePanelRef } from "react-resizable-panels";

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

  const sidePanelRef = usePanelRef();

  // Imperatively expand/collapse the side panel so children never unmount.
  // Calling an imperative method from an effect is fine — this is not setState.
  useEffect(() => {
    if (panelExpanded) {
      sidePanelRef.current?.expand();
    } else {
      sidePanelRef.current?.collapse();
    }
  }, [panelExpanded, sidePanelRef]);

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
        {/* Main content — always at this tree position so ListData never remounts */}
        <ResizablePanel
          defaultSize={hasSidePanel ? 80 : 100}
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

        {/* Hide the drag handle when collapsed so users can't accidentally expand */}
        <ResizableHandle withHandle className={panelExpanded ? "" : "hidden"} />

        {/* Side panel — collapsible to 0 so it stays mounted but takes no space */}
        <ResizablePanel
          panelRef={sidePanelRef}
          collapsible
          collapsedSize={0}
          defaultSize={hasSidePanel ? 20 : 0}
          minSize="20%"
          maxSize="60%"
          className="relative min-h-0 overflow-hidden"
        >
          {/* absolute inset-0 breaks the h-full chain dependency */}
          <div className="absolute inset-0 flex flex-col overflow-hidden">
            {sidePanel}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
