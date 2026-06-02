"use client";

import { useState, useEffect, type ReactNode } from "react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { Button } from "@/components/ui/button";

import {
  PanelRightClose,
  PanelRightOpen,
  Download,
  FlaskConical,
  Dna,
} from "lucide-react";

interface GenomeShellProps {
  children: ReactNode;
  sidePanel: ReactNode;
  hasSidePanel?: boolean;
}

export function GenomeShell({
  children,
  sidePanel,
  hasSidePanel = true,
}: GenomeShellProps) {
  const [panelExpanded, setPanelExpanded] = useState(false);

  // If the parent indicates there is an active side panel (e.g. a selected genome),
  // ensure the panel is expanded so the user sees the details. If there is no
  // active item, collapse the panel.
  // NOTE: only auto-expand when the parent reports an active item. Do not
  // automatically collapse when there is no active item so user-controlled
  // "Show"/"Hide" persists. This allows the user to open the panel first
  // (showing "No rows selected") and then select rows while keeping the
  // panel at the configured default width.
  useEffect(() => {
    if (hasSidePanel) {
      setPanelExpanded(true);
    }
    // intentionally do NOT setPanelExpanded(false) when hasSidePanel becomes false
    // so the user's manual toggle is respected.
  }, [hasSidePanel]);

  const actionStrip = (
    <div className="bg-muted/30 flex flex-col w-[72px] shrink-0 border-l min-h-0">
      {/* Top toggle button */}
      <div className="border-b p-4">
        {panelExpanded ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPanelExpanded(false)}
            title="Hide panel"
          >
            <PanelRightClose className="h-4 w-4" /> Hide
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPanelExpanded(true)}
            title="Show panel"
          >
            <PanelRightOpen className="h-4 w-4" /> Show
          </Button>
        )}
      </div>

      {/* Future action buttons */}
      <div className="flex flex-1 flex-col items-center gap-2 py-2">
        <Button
          variant="ghost"
          size="icon"
          disabled
          title="Coming soon"
        >
          <Download className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          disabled
          title="Coming soon"
        >
          <FlaskConical className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          disabled
          title="Coming soon"
        >
          <Dna className="h-4 w-4" />
        </Button>
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
    // Use flex-1 + min-h-0 instead of h-screen so the shell doesn't force
    // the page height when the side panel is shown. This keeps the vertical
    // action strip the same height as the table and prevents the footer from
    // being pushed down.
    <div className="flex-1 min-h-0 w-full flex overflow-hidden max-h-screen">
      {/* Remount the group whenever panelExpanded or hasSidePanel changes so
          default sizes are applied consistently (avoids the 0->small size
          when toggling visibility). */}
      <ResizablePanelGroup
        key={`resizable-${panelExpanded}-${hasSidePanel}`}
        orientation="horizontal"
        className="flex-1 min-h-0 w-full flex h-full max-h-screen"
      >
        <ResizablePanel
          defaultSize={80}
          minSize="20%"
          className="flex min-h-0 min-w-0 h-full max-h-screen overflow-hidden"
        >
          <div className="flex flex-col flex-1 min-h-0 h-full max-h-screen overflow-auto">
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
          className="min-h-0 flex flex-col h-full max-h-screen overflow-hidden"
        >
          <div className="flex flex-col min-h-0 flex-1 h-full max-h-screen overflow-auto">
            {sidePanel}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}