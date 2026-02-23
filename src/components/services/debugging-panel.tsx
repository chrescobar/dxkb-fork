"use client";

import { useState, useEffect, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useServiceDebugging } from "@/contexts/service-debugging-context";

export function DebuggingPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { isDebugMode, containerBuildId, setIsDebugMode, setContainerBuildId } = useServiceDebugging();

  // Local state for the dialog
  const [localDebugMode, setLocalDebugMode] = useState(isDebugMode);
  const [localContainerId, setLocalContainerId] = useState(containerBuildId);

  // Sync local state with context when dialog opens
  const [prevSyncKey, setPrevSyncKey] = useState("");
  const syncKey = isOpen ? `${isDebugMode}-${containerBuildId}` : "";
  if (syncKey && syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    setLocalDebugMode(isDebugMode);
    setLocalContainerId(containerBuildId);
  } else if (!syncKey && prevSyncKey) {
    setPrevSyncKey("");
  }

  const handleOpenDialog = useCallback(() => {
    setLocalDebugMode(isDebugMode);
    setLocalContainerId(containerBuildId);
    setIsOpen(true);
  }, [isDebugMode, containerBuildId]);

  // Add keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        handleOpenDialog();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleOpenDialog]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Sync with current values when opening
      setLocalDebugMode(isDebugMode);
      setLocalContainerId(containerBuildId);
    }
    setIsOpen(open);
  };

  const handleSave = () => {
    setIsDebugMode(localDebugMode);
    setContainerBuildId(localContainerId);
    setIsOpen(false);
  };



  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Debugging Panel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="debug-mode"
              name="debug-mode"
              checked={localDebugMode}
              onCheckedChange={(checked) => setLocalDebugMode(checked)}
            />
            <Label
              htmlFor="debug-mode"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Don&apos;t Submit Jobs (print to params to console)
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="container-build-id" className="text-sm font-medium">
              Use Container Build ID:
            </Label>
            <Input
              id="container-build-id"
              type="text"
              value={localContainerId}
              onChange={(e) => setLocalContainerId(e.target.value)}
              placeholder="Enter container build ID"
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleSave}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
