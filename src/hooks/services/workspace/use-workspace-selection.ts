"use client";

import { useState } from "react";
import type { WorkspaceItem } from "@/lib/services/workspace/domain";
import {
  computeNextSelection,
  normalizePath,
  type SelectionModifiers,
} from "@/lib/workspace/table-selection";

export interface UseWorkspaceSelectionOptions {
  processedItems: WorkspaceItem[];
  panelManuallyHidden: boolean;
  setPanelExpanded: (v: boolean) => void;
}

export interface UseWorkspaceSelectionReturn {
  selectedItems: WorkspaceItem[];
  anchorPath: string | null;
  selectedPaths: string[];
  /** Last selected item, or null when nothing is selected. */
  primaryItem: WorkspaceItem | null;
  handleSelectItem: (
    item: WorkspaceItem,
    modifiers?: SelectionModifiers,
  ) => void;
  clearSelection: () => void;
}

export function useWorkspaceSelection({
  processedItems,
  panelManuallyHidden,
  setPanelExpanded,
}: UseWorkspaceSelectionOptions): UseWorkspaceSelectionReturn {
  const [selectedItems, setSelectedItems] = useState<WorkspaceItem[]>([]);
  const [anchorPath, setAnchorPath] = useState<string | null>(null);

  // Keep selected items in sync with latest processedItems data (e.g. after type change refetch)
  const [prevProcessedItems, setPrevProcessedItems] = useState(processedItems);
  if (prevProcessedItems !== processedItems) {
    setPrevProcessedItems(processedItems);
    if (selectedItems.length > 0) {
      const itemByPath = new Map(
        processedItems.map((i) => [normalizePath(i.path), i]),
      );
      const updated = selectedItems.map(
        (old) => itemByPath.get(normalizePath(old.path)) ?? old,
      );
      if (!updated.every((item, idx) => item === selectedItems[idx])) {
        setSelectedItems(updated);
      }
    }
  }

  const selectedPaths = selectedItems.map((i) => normalizePath(i.path));

  const primaryItem: WorkspaceItem | null =
    selectedItems[selectedItems.length - 1] ?? null;

  const handleSelectItem = (
    item: WorkspaceItem,
    modifiers?: SelectionModifiers,
  ) => {
    const { nextSelection, nextAnchorPath } = computeNextSelection(
      processedItems,
      selectedItems,
      anchorPath,
      item,
      modifiers ?? { ctrlOrMeta: false, shift: false },
    );
    setSelectedItems(nextSelection);
    setAnchorPath(nextAnchorPath);
    if (!panelManuallyHidden) setPanelExpanded(true);
  };

  const clearSelection = () => {
    setSelectedItems([]);
    setAnchorPath(null);
  };

  return {
    selectedItems,
    anchorPath,
    selectedPaths,
    primaryItem,
    handleSelectItem,
    clearSelection,
  };
}
