"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { GeoMapState, GeoMapView } from "./types";

interface StateOption {
  fips: string;
  name: string;
}

interface MapControlsProps {
  mapState: GeoMapState;
  stateOptions: StateOption[];
  onViewChange: (view: GeoMapView) => void;
  onSelectState: (fips: string, name: string) => void;
}

export function MapControls({
  mapState,
  stateOptions,
  onViewChange,
  onSelectState,
}: MapControlsProps) {
  const isStateView = mapState.view === "state";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="bg-muted/50 inline-flex items-center gap-0.5 rounded-md p-0.5">
        <PillButton active={mapState.view === "world"} onClick={() => onViewChange("world")}>
          World
        </PillButton>
        <PillButton active={mapState.view === "us"} onClick={() => onViewChange("us")}>
          United States
        </PillButton>
        <PillButton active={isStateView} onClick={() => onViewChange("state")}>
          State
        </PillButton>
      </div>

      <div className={cn(
        "overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out",
        isStateView && stateOptions.length > 0 ? "max-w-[220px] opacity-100" : "max-w-0 opacity-0 pointer-events-none",
      )}>
        <Select
          items={stateOptions.map((option) => ({ value: option.fips, label: option.name }))}
          value={mapState.selectedStateFips ?? ""}
          onValueChange={(value) => {
            if (!value) return;
            const option = stateOptions.find((o) => o.fips === value);
            if (option) onSelectState(option.fips, option.name);
          }}
        >
          <SelectTrigger className="h-7 min-w-[160px] text-xs">
            <SelectValue placeholder="View state…" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {stateOptions.map((option) => (
                <SelectItem key={option.fips} value={option.fips}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {isStateView && mapState.selectedStateName && (
        <Button
          type="button"
          variant="secondary"
          size="xs"
          onClick={() => onViewChange("us")}
          aria-label={`Exit ${mapState.selectedStateName}`}
          className="gap-1.5 text-xs"
        >
          <span>{mapState.selectedStateName}</span>
          <X className="h-3 w-3 shrink-0" />
        </Button>
      )}
    </div>
  );
}

interface PillButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function PillButton({ active, onClick, children }: PillButtonProps) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      size="xs"
      onClick={onClick}
      className={cn("text-xs transition-colors duration-150", active && "shadow-sm")}
    >
      {children}
    </Button>
  );
}
