"use client";

import type { ChangeEvent, KeyboardEvent, RefObject } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  ChevronDown,
  FolderOpen,
  Loader2,
  Search,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { WorkspaceObject } from "@/lib/services/workspace/types";
import { cn } from "@/lib/utils";

interface DropdownLayout {
  openUpward: boolean;
  maxHeight: number;
  rect: { top: number; left: number; width: number; bottom?: number } | null;
}

interface WorkspaceObjectSelectorViewProps {
  className?: string;
  placeholder: string;
  validationError: string | null;
  inputValue: string;
  searchQuery: string;
  objects: WorkspaceObject[];
  loading: boolean;
  error: string | null;
  showDropdown: boolean;
  isDialogOpen: boolean;
  highlightedIndex: number;
  dropdownLayout: DropdownLayout;
  inputRef: RefObject<HTMLDivElement | null>;
  inputElementRef: RefObject<HTMLInputElement | null>;
  dropdownRef: RefObject<HTMLDivElement | null>;
  itemRefs: RefObject<(HTMLButtonElement | null)[]>;
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onInputFocus: () => void;
  onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onToggleDropdown: () => void;
  onDialogOpenChange: (open: boolean) => void;
  onObjectClick: (object: WorkspaceObject) => void;
  onObjectHighlight: (index: number) => void;
}

function WorkspaceObjectDropdown({
  objects,
  loading,
  error,
  searchQuery,
  highlightedIndex,
  dropdownLayout,
  dropdownRef,
  itemRefs,
  onObjectClick,
  onObjectHighlight,
}: Pick<
  WorkspaceObjectSelectorViewProps,
  | "objects"
  | "loading"
  | "error"
  | "searchQuery"
  | "highlightedIndex"
  | "dropdownLayout"
  | "dropdownRef"
  | "itemRefs"
  | "onObjectClick"
  | "onObjectHighlight"
>) {
  const { rect, openUpward, maxHeight } = dropdownLayout;
  if (!rect || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-25 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent overflow-y-auto rounded-md border bg-popover shadow-md hover:scrollbar-thumb-muted-foreground/40 dark:scrollbar-thumb-muted-foreground/30 dark:hover:scrollbar-thumb-muted-foreground/50"
      style={{
        ...(openUpward
          ? { bottom: rect.bottom, top: "auto" }
          : { top: rect.top }),
        left: rect.left,
        width: rect.width,
        maxHeight,
      }}
    >
      {error ? (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              Failed to load workspace objects: {error}
            </AlertDescription>
          </Alert>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="mr-2 size-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      ) : objects.length > 0 ? (
        objects.map((object, index) => {
          const cleanPath =
            object.path.replace(/^\/[^/]+@[^/]+/, "") ||
            object.path ||
            object.name ||
            "Unnamed Object";
          return (
            <button
              type="button"
              key={object.id}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between p-2 text-left hover:bg-accent",
                highlightedIndex === index && "bg-accent",
              )}
              onClick={() => {
                onObjectClick(object);
              }}
              onMouseEnter={() => {
                onObjectHighlight(index);
              }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{object.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {cleanPath}
                </p>
              </div>
            </button>
          );
        })
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {searchQuery
            ? "No objects found matching your search"
            : "No objects found"}
        </p>
      )}
    </div>,
    document.body,
  );
}

export function WorkspaceObjectSelectorView({
  className,
  placeholder,
  validationError,
  inputValue,
  searchQuery,
  objects,
  loading,
  error,
  showDropdown,
  isDialogOpen,
  highlightedIndex,
  dropdownLayout,
  inputRef,
  inputElementRef,
  dropdownRef,
  itemRefs,
  onInputChange,
  onInputFocus,
  onInputKeyDown,
  onToggleDropdown,
  onDialogOpenChange,
  onObjectClick,
  onObjectHighlight,
}: WorkspaceObjectSelectorViewProps) {
  return (
    <div className={className ? `relative ${className}` : "relative w-full"}>
      {validationError && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="size-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-row items-center gap-2">
        <div ref={inputRef} className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputElementRef}
            placeholder={placeholder}
            value={inputValue}
            onChange={onInputChange}
            onFocus={onInputFocus}
            onKeyDown={onInputKeyDown}
            className="service-card-input w-full px-10"
          />
          <Button
            type="button"
            aria-label={showDropdown ? "Hide suggestions" : "Show suggestions"}
            aria-expanded={showDropdown}
            onClick={onToggleDropdown}
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown
              className={`size-4 transition-transform ${showDropdown ? "rotate-180" : ""}`}
            />
          </Button>
          {showDropdown && (
            <WorkspaceObjectDropdown
              objects={objects}
              loading={loading}
              error={error}
              searchQuery={searchQuery}
              highlightedIndex={highlightedIndex}
              dropdownLayout={dropdownLayout}
              dropdownRef={dropdownRef}
              itemRefs={itemRefs}
              onObjectClick={onObjectClick}
              onObjectHighlight={onObjectHighlight}
            />
          )}
        </div>
        <Dialog open={isDialogOpen} onOpenChange={onDialogOpenChange}>
          <DialogTrigger
            render={(triggerProps) => (
              <Button
                {...triggerProps}
                variant="outline"
                size="icon"
                aria-label="Browse workspace"
                className="shrink-0"
              >
                <FolderOpen className="size-4" />
              </Button>
            )}
          />
          <DialogContent className="max-h-[80vh] max-w-4xl">
            <DialogHeader>
              <DialogTitle>Choose or Upload a Workspace Object</DialogTitle>
            </DialogHeader>
            <div className="rounded-lg border p-8 text-center">
              <FolderOpen className="mx-auto mb-4 size-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">Workspace Browser</h3>
              <p className="mb-4 text-muted-foreground">
                This will be the full workspace browser interface where users
                can navigate folders, upload files, and select objects.
              </p>
              <div className="text-sm text-muted-foreground">
                <p>Features to be implemented:</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Folder navigation with breadcrumbs</li>
                  <li>File and folder listing with details</li>
                  <li>Upload functionality</li>
                  <li>Search and filter options</li>
                  <li>Selection and confirmation</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
