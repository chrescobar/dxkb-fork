"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { DeleteButtonWithHold } from "./delete-button-with-hold";

export interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  pendingDeleteSelection: { name?: string }[];
  nonEmptyFolderPathsInDelete: string[];
  deleteHoldProgress: number;
  onDeleteHoldStart: () => void;
  onDeleteHoldEnd: () => void;
  onConfirmDelete: () => void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  isDeleting,
  pendingDeleteSelection,
  nonEmptyFolderPathsInDelete,
  deleteHoldProgress,
  onDeleteHoldStart,
  onDeleteHoldEnd,
  onConfirmDelete,
}: DeleteConfirmDialogProps) {
  const deleteTargetLabel =
    pendingDeleteSelection.length === 0
      ? "item"
      : pendingDeleteSelection.length === 1
        ? pendingDeleteSelection[0]?.name ?? "item"
        : `${pendingDeleteSelection.length} items`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>Delete from workspace</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete
          <span className="font-semibold italic"> {deleteTargetLabel}</span>?
          {nonEmptyFolderPathsInDelete.length > 0 && (
            <span className="block font-bold text-destructive">
              {"\n"}This folder is NOT empty.
            </span>
          )}
          This action cannot be undone.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          {nonEmptyFolderPathsInDelete.length > 0 ? (
            <DeleteButtonWithHold
              isDeleting={isDeleting}
              holdProgress={deleteHoldProgress}
              onHoldStart={onDeleteHoldStart}
              onHoldEnd={onDeleteHoldEnd}
            />
          ) : (
            <AlertDialogAction
              variant="destructive"
              onClick={() => void onConfirmDelete()}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Spinner className="mr-2 h-3.5 w-3.5 shrink-0" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
