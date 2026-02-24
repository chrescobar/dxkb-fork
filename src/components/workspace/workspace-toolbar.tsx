"use client";

import { RefreshCw, Search, FolderPlus, Upload, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const typeFilterOptions = [
  { value: "all", label: "All Types" },
  { value: "folder", label: "Folders" },
  { value: "contigs", label: "Contigs" },
  { value: "reads", label: "Reads" },
  { value: "job_result", label: "Job Results" },
  { value: "genome_group", label: "Genome Groups" },
  { value: "feature_group", label: "Feature Groups" },
  { value: "experiment_group", label: "Experiment Groups" },
  { value: "txt", label: "Text Files" },
  { value: "csv", label: "CSV Files" },
  { value: "json", label: "JSON Files" },
  { value: "pdf", label: "PDF Files" },
  { value: "pdb", label: "PDB Files" },
];

interface WorkspaceToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  showHiddenFiles: boolean;
  onShowHiddenFilesChange: (show: boolean) => void;
}

export function WorkspaceToolbar({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  onRefresh,
  isRefreshing,
  showHiddenFiles,
  onShowHiddenFilesChange,
}: WorkspaceToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <Select
          items={typeFilterOptions}
          value={typeFilter}
          onValueChange={(value) => {
            if (value != null) onTypeFilterChange(value);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {typeFilterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="relative max-w-xs flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onShowHiddenFilesChange(!showHiddenFiles)}
          title={showHiddenFiles ? "Hide dotfiles and hidden items" : "Show hidden files (e.g. .folder)"}
          aria-pressed={showHiddenFiles}
        >
          {showHiddenFiles ? (
            <EyeOff className="h-4 w-4" data-icon="inline-start" />
          ) : (
            <Eye className="h-4 w-4" data-icon="inline-start" />
          )}
          {showHiddenFiles ? "Hide hidden" : "Show hidden"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            data-icon="inline-start"
          />
          Refresh
        </Button>

        <Button variant="outline" size="sm" disabled>
          <FolderPlus className="h-4 w-4" data-icon="inline-start" />
          New Folder
        </Button>

        <Button variant="outline" size="sm" disabled>
          <Upload className="h-4 w-4" data-icon="inline-start" />
          Upload
        </Button>
      </div>
    </div>
  );
}
