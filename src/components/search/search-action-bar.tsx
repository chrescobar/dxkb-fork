"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  BookOpen,
  Copy,
  Settings,
  Group,
  Binary,
  ArrowRightLeft,
  Map,
  Eye,
  List,
  type LucideIcon,
} from "lucide-react";

export type SearchActionId =
  | "guide"
  | "copyRows"
  | "services"
  | "genome"
  | "genomes"
  | "group"
  | "feature"
  | "fasta"
  | "idMap"
  | "epitope"
  | "structure"
  | "surveillance"
  | "map"
  | "serology"
  | "taxonOverview"
  | "features"
  | "experiment"
  | "biosets";

interface ActionConfig {
  id: SearchActionId;
  label: string;
  labelClassName?: string;
  icon?: LucideIcon;
  letter?: string;
  validSearchTypes: string[] | "*";
  requiresSelection?: boolean;
  disabledWithTooltip?: string;
}

const notReady = "This button's functionality is not yet operational.";

const actionConfig: ActionConfig[] = [
  {
    id: "guide",
    label: "GUIDE",
    icon: BookOpen,
    validSearchTypes: "*",
    requiresSelection: false,
  },
  {
    id: "copyRows",
    label: "COPY",
    icon: Copy,
    validSearchTypes: ["genome", "strain", "genome_feature", "protein_feature", "epitope", "protein_structure", "surveillance", "serology"],
    requiresSelection: true,
    disabledWithTooltip: notReady,
  },
  {
    id: "services",
    label: "SERVICES",
    icon: Settings,
    validSearchTypes: "*",
    requiresSelection: true,
    disabledWithTooltip: notReady,
  },
  {
    id: "genome",
    label: "GENOME",
    letter: "G",
    validSearchTypes: ["genome", "genome_feature", "protein_feature", "protein_structure"],
    requiresSelection: true,
    disabledWithTooltip: notReady,
  },
  {
    id: "genomes",
    label: "GENOMES",
    labelClassName: "text-[10px]",
    letter: "G",
    validSearchTypes: ["strain", "taxonomy"],
    requiresSelection: true,
    disabledWithTooltip: notReady,
  },
  {
    id: "group",
    label: "GROUP",
    icon: Group,
    validSearchTypes: ["genome", "strain", "genome_feature"],
    requiresSelection: true,
    disabledWithTooltip: notReady,
  },
  {
    id: "feature",
    label: "FEATURE",
    letter: "F",
    validSearchTypes: ["genome_feature", "protein_feature", "protein_structure"],
    requiresSelection: true,
    disabledWithTooltip: notReady,
  },
  {
    id: "fasta",
    label: "FASTA",
    icon: Binary,
    validSearchTypes: ["genome_feature"],
    requiresSelection: true,
    disabledWithTooltip: notReady,
  },
  {
    id: "idMap",
    label: "ID MAP",
    icon: ArrowRightLeft,
    validSearchTypes: ["genome_feature"],
    requiresSelection: true,
    disabledWithTooltip: notReady,
  },
  {
    id: "epitope",
    label: "EPITOPE",
    letter: "E",
    validSearchTypes: ["epitope"],
    requiresSelection: true,
    disabledWithTooltip: notReady,
  },
  {
    id: "structure",
    label: "STRUCTURE",
    labelClassName: "text-[10px]",
    letter: "S",
    validSearchTypes: ["protein_structure"],
    requiresSelection: true,
    disabledWithTooltip: notReady,
  },
  {
    id: "surveillance",
    label: "SRVLNCE",
    letter: "S",
    validSearchTypes: ["surveillance"],
    requiresSelection: true,
    disabledWithTooltip: notReady,
  },
  {
    id: "map",
    label: "MAP",
    icon: Map,
    validSearchTypes: ["surveillance"],
    requiresSelection: true,
    disabledWithTooltip: notReady,
  },
  {
    id: "serology",
    label: "SEROLOGY",
    labelClassName: "text-[10px]",
    letter: "S",
    validSearchTypes: ["serology"],
    requiresSelection: true,
    disabledWithTooltip: notReady,
  },
  {
    id: "taxonOverview",
    label: "TAXON\nOVERVIEW",
    labelClassName: "text-[9px]",
    icon: Eye,
    validSearchTypes: ["taxonomy"],
    requiresSelection: true,
    disabledWithTooltip: notReady,
  },
  {
    id: "features",
    label: "FEATURES",
    letter: "F",
    validSearchTypes: ["taxonomy"],
    requiresSelection: true,
    disabledWithTooltip: notReady,
  },
  {
    id: "experiment",
    label: "EXPERMNT",
    labelClassName: "text-[10px]",
    letter: "E",
    validSearchTypes: ["experiment"],
    requiresSelection: true,
    disabledWithTooltip: notReady,
  },
  {
    id: "biosets",
    label: "BIOSETS",
    icon: List,
    validSearchTypes: ["experiment"],
    requiresSelection: true,
    disabledWithTooltip: notReady,
  },
];

export interface SearchActionBarProps {
  selectedCount: number;
  searchType: string;
  guideUrl?: string;
  disabledActionIds?: SearchActionId[];
  loadingActionIds?: SearchActionId[];
  onAction?: (actionId: SearchActionId) => void;
}

export function SearchActionBar({
  selectedCount,
  searchType,
  guideUrl,
  disabledActionIds,
  loadingActionIds,
  onAction,
}: SearchActionBarProps) {
  const visibleActions = actionConfig.filter((action) => {
    if (action.validSearchTypes !== "*" && !action.validSearchTypes.includes(searchType)) {
      return false;
    }
    // Hide selection-dependent buttons until at least one row is selected
    if (action.requiresSelection && selectedCount === 0) {
      return false;
    }
    return true;
  });

  const isDisabled = (action: ActionConfig) =>
    !!(action.disabledWithTooltip || disabledActionIds?.includes(action.id));

  const isLoading = (actionId: SearchActionId) =>
    loadingActionIds?.includes(actionId) ?? false;

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-1">
        {visibleActions.map((action) => {
          const Icon = action.icon;
          const showSpinner = isLoading(action.id);
          const disabled = isDisabled(action);
          const tooltipText = action.disabledWithTooltip;

          const buttonEl = (
            <Button
              key={action.id}
              variant="secondary"
              className="h-[60px] w-full flex-col gap-1 overflow-hidden px-1 font-normal"
              disabled={disabled}
              onClick={() => {
                if (action.id === "guide") {
                  if (guideUrl) window.open(guideUrl, "_blank", "noopener,noreferrer");
                } else {
                  onAction?.(action.id);
                }
              }}
            >
              {showSpinner ? (
                <Spinner className="h-4 w-4 shrink-0" />
              ) : action.letter ? (
                <span className="text-2xl font-black leading-none">{action.letter}</span>
              ) : Icon ? (
                <Icon className="h-4 w-4 shrink-0" />
              ) : null}
              <span className={`w-full break-words text-center font-medium leading-tight ${action.labelClassName ?? "text-[11px]"}`}>
                {action.label.split("\n").map((line, i) => (
                  <span key={i} className="block">{line}</span>
                ))}
              </span>
            </Button>
          );

          return tooltipText && disabled ? (
            <Tooltip key={action.id}>
              <TooltipTrigger
                render={
                  <span className="inline-flex w-full cursor-not-allowed">
                    {buttonEl}
                  </span>
                }
              />
              <TooltipContent side="left">
                <p>{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            buttonEl
          );
        })}
      </div>
    </TooltipProvider>
  );
}
