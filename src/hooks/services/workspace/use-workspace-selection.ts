"use client";

import { useState, useCallback, useMemo } from "react";
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

export function useWorkspaceSelection({
  processedItems,
  panelManuallyHidden,
  setPanelExpanded,
}: UseWorkspaceSelectionOptions) {
  const [selectedItems, setSelectedItems] = useState<WorkspaceItem[]>([]);
  const [anchorPath, setAnchorPath] = useState<string | null>(null);

  // Keep selected items in sync with latest processedItems data (e.g. after type change refetch)
  const [prevProcessedItems, setPrevProcessedItems] = useState(processedItems);
  if (prevProcessedItems !== processedItems) {
    setPrevProcessedItems(processedItems);
    if (selectedItems.length > 0) {
      const itemByPath = new Map(processedItems.map((i) => [normalizePath(i.path), i]));
      const updated = selectedItems.map((old) => itemByPath.get(normalizePath(old.path)) ?? old);
      if (!updated.every((item, idx) => item === selectedItems[idx])) {
        setSelectedItems(updated);
      }
    }
  }

  const selectedPaths = useMemo(
    () => selectedItems.map((i) => normalizePath(i.path)),
    [selectedItems],
  );

  const primaryItem = selectedItems[selectedItems.length - 1] ?? null;

  const handleSelectItem = useCallback(
    (item: WorkspaceItem, modifiers?: SelectionModifiers) => {
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
    },
    [processedItems, selectedItems, anchorPath, panelManuallyHidden, setPanelExpanded],
  );

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
    setAnchorPath(null);
  }, []);

  return {
    selectedItems,
    anchorPath,
    selectedPaths,
    primaryItem,
    handleSelectItem,
    clearSelection,
  };
}
