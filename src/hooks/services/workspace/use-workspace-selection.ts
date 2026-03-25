"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { WorkspaceBrowserItem } from "@/types/workspace-browser";
import {
  computeNextSelection,
  normalizePath,
  type SelectionModifiers,
} from "@/lib/workspace/table-selection";

export interface UseWorkspaceSelectionOptions {
  processedItems: WorkspaceBrowserItem[];
  panelManuallyHidden: boolean;
  setPanelExpanded: (v: boolean) => void;
}

export function useWorkspaceSelection({
  processedItems,
  panelManuallyHidden,
  setPanelExpanded,
}: UseWorkspaceSelectionOptions) {
  const [selectedItems, setSelectedItems] = useState<WorkspaceBrowserItem[]>([]);
  const [anchorPath, setAnchorPath] = useState<string | null>(null);

  // Keep selected items in sync with latest processedItems data (e.g. after type change refetch)
  const prevItemsRef = useRef(processedItems);
  useEffect(() => {
    if (prevItemsRef.current === processedItems) return;
    prevItemsRef.current = processedItems;
    if (selectedItems.length === 0) return;
    const itemByPath = new Map(processedItems.map((i) => [normalizePath(i.path), i]));
    setSelectedItems((prev) => {
      const updated = prev.map((old) => itemByPath.get(normalizePath(old.path)) ?? old);
      // Only update state if something actually changed
      if (updated.every((item, idx) => item === prev[idx])) return prev;
      return updated;
    });
  }, [processedItems, selectedItems.length]);

  const selectedPaths = useMemo(
    () => selectedItems.map((i) => normalizePath(i.path)),
    [selectedItems],
  );

  const primaryItem = selectedItems[selectedItems.length - 1] ?? null;

  const handleSelectItem = useCallback(
    (item: WorkspaceBrowserItem, modifiers?: SelectionModifiers) => {
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
