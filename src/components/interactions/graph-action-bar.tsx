"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Download } from "lucide-react";

import { allLayouts } from "@/lib/interactions/renderer-capabilities";
import type { LayoutName } from "@/lib/interactions/types";

const notReady = "Coming soon, still under construction";

const layoutLabels: Record<LayoutName, string> = {
  cola: "Cola",
  "cose-bilkent": "Cose-Bilkent",
  dagre: "Dagre",
  grid: "Grid",
  concentric: "Concentric",
  random: "Random",
  forceatlas2: "Force Atlas 2",
  circular: "Circular",
};

interface GraphActionBarProps {
  layout: LayoutName;
  onLayoutChange: (layout: LayoutName) => void;
  onExport: () => void;
  exportReady: boolean;
}

/**
 * Graph action band. Sits directly above the canvas, spanning only the canvas
 * column (between the legend/node list on the left and the detail panel on the
 * right). Holds the export, sub-graph, hub-protein, and layout controls.
 */
export function GraphActionBar({
  layout,
  onLayoutChange,
  onExport,
  exportReady,
}: GraphActionBarProps) {
  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-2 border-b bg-card px-2 py-1.5">
        <Tooltip>
          <TooltipTrigger
            render={
              <span className={exportReady ? undefined : "inline-flex cursor-not-allowed"} tabIndex={exportReady ? undefined : 0}>
                <Button variant="outline" size="sm" onClick={onExport} disabled={!exportReady}>
                  <Download />
                  Export
                </Button>
              </span>
            }
          />
          {!exportReady && (
            <TooltipContent>
              <p>Loading graph…</p>
            </TooltipContent>
          )}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <span className="inline-flex cursor-not-allowed" tabIndex={0}>
                <Button variant="outline" size="sm" disabled>
                  Sub-Graph
                </Button>
              </span>
            }
          />
          <TooltipContent>
            <p>{notReady}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <span className="inline-flex cursor-not-allowed" tabIndex={0}>
                <Button variant="outline" size="sm" disabled>
                  Hub Protein
                </Button>
              </span>
            }
          />
          <TooltipContent>
            <p>{notReady}</p>
          </TooltipContent>
        </Tooltip>

        <Select items={layoutLabels} value={layout} onValueChange={(value) => { onLayoutChange(value as LayoutName); }}>
          <SelectTrigger aria-label="Layout" className="w-40 bg-background">
            <SelectValue placeholder="Layout" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {allLayouts.map((name) => (
                <SelectItem key={name} value={name}>
                  {layoutLabels[name]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </TooltipProvider>
  );
}
