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
  onClearState: () => void;
}

export function MapControls({
  mapState,
  stateOptions,
  onViewChange,
  onSelectState,
  onClearState,
}: MapControlsProps) {
  const showStatePill = mapState.view === "state" && mapState.selectedStateName;
  const showDropdown = mapState.view === "us" || mapState.view === "state";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="bg-muted/50 inline-flex items-center gap-0.5 rounded-md p-0.5">
        <PillButton active={mapState.view === "world"} onClick={() => onViewChange("world")}>
          World
        </PillButton>
        <PillButton active={mapState.view === "us"} onClick={() => onViewChange("us")}>
          United States
        </PillButton>
      </div>

      {showStatePill && (
        <div className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium">
          <span>{mapState.selectedStateName}</span>
          <button
            type="button"
            aria-label={`Exit ${mapState.selectedStateName} drill-down`}
            onClick={onClearState}
            className="hover:bg-primary/20 -mr-1 rounded p-0.5"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      <div className={cn(
        "overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out",
        showDropdown && stateOptions.length > 0 ? "max-w-[220px] opacity-100" : "max-w-0 opacity-0 pointer-events-none",
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
