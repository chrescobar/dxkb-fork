"use client";

import type React from "react";
import { Construction } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { CopyToDialog } from "./copy-to-dialog";
import { CreateFolderDialog } from "./create-folder-dialog";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { DownloadOptionsDialog } from "./download-options-dialog";
import { UploadDialog } from "./upload-dialog";
import { EditTypeDialog } from "./edit-type-dialog";
import { DeleteButtonWithHold } from "./delete-button-with-hold";
import type { WorkspaceDownloadMethods } from "@/lib/services/workspace/methods/download";
import type { WorkspaceBrowserItem } from "@/types/workspace-browser";

export interface WorkspaceDialogsProps {
  deleteDialogOpen: boolean;
  onDeleteDialogOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  pendingDeleteSelection: { name?: string }[];
  nonEmptyFolderPathsInDelete: string[];
  deleteHoldProgress: number;
  onDeleteHoldStart: () => void;
  onDeleteHoldEnd: () => void;
  onConfirmDelete: () => void;
  copyDialogOpen: boolean;
  onCopyDialogOpenChange: (open: boolean) => void;
  pendingCopySelection: WorkspaceBrowserItem[];
  currentUserWorkspaceRoot: string;
  onCopyConfirm: (destinationPath: string, filenameOverride?: string) => Promise<void>;
  isCopying: boolean;
  copyMoveDialogMode: "copy" | "move";
  editTypeDialogOpen: boolean;
  onEditTypeDialogOpenChange: (open: boolean) => void;
  pendingEditTypeItem: WorkspaceBrowserItem | null;
  setPendingEditTypeItem: React.Dispatch<React.SetStateAction<WorkspaceBrowserItem | null>>;
  onEditTypeConfirm: (newType: string) => Promise<void>;
  isUpdatingType: boolean;
  newFolderDialogOpen: boolean;
  onNewFolderDialogOpenChange: (open: boolean) => void;
  onCreateFolder: (folderName: string) => Promise<void>;
  isCreatingFolder: boolean;
  createWorkspaceDialogOpen: boolean;
  onCreateWorkspaceDialogOpenChange: (open: boolean) => void;
  onCreateWorkspace: (workspaceName: string) => Promise<void>;
  isCreatingWorkspace: boolean;
  uploadDialogOpen: boolean;
  onUploadDialogOpenChange: (open: boolean) => void;
  currentDirectoryPath: string;
  onUploadComplete: () => void;
  downloadOptionsOpen: boolean;
  onDownloadOptionsOpenChange: (open: boolean) => void;
  downloadOptionsPaths: string[];
  downloadOptionsDefaultName: string;
  workspaceDownload: WorkspaceDownloadMethods;
  fileViewerConstructionOpen: boolean;
  onFileViewerConstructionOpenChange: (open: boolean) => void;
}

export function WorkspaceDialogs(props: WorkspaceDialogsProps) {
  const {
    deleteDialogOpen,
    onDeleteDialogOpenChange,
    isDeleting,
    pendingDeleteSelection,
    nonEmptyFolderPathsInDelete,
    deleteHoldProgress,
    onDeleteHoldStart,
    onDeleteHoldEnd,
    onConfirmDelete,
    copyDialogOpen,
    onCopyDialogOpenChange,
    pendingCopySelection,
    currentUserWorkspaceRoot,
    onCopyConfirm,
    isCopying,
    copyMoveDialogMode,
    editTypeDialogOpen,
    onEditTypeDialogOpenChange,
    pendingEditTypeItem,
    setPendingEditTypeItem,
    onEditTypeConfirm,
    isUpdatingType,
    newFolderDialogOpen,
    onNewFolderDialogOpenChange,
    onCreateFolder,
    isCreatingFolder,
    createWorkspaceDialogOpen,
    onCreateWorkspaceDialogOpenChange,
    onCreateWorkspace,
    isCreatingWorkspace,
    uploadDialogOpen,
    onUploadDialogOpenChange,
    currentDirectoryPath,
    onUploadComplete,
    downloadOptionsOpen,
    onDownloadOptionsOpenChange,
    downloadOptionsPaths,
    downloadOptionsDefaultName,
    workspaceDownload,
    fileViewerConstructionOpen,
    onFileViewerConstructionOpenChange,
  } = props;

  const deleteTargetLabel =
    pendingDeleteSelection.length === 0
      ? "item"
      : pendingDeleteSelection.length === 1
        ? pendingDeleteSelection[0]?.name ?? "item"
        : `${pendingDeleteSelection.length} items`;

  return (
    <>
      <CopyToDialog
        open={copyDialogOpen}
        onOpenChange={onCopyDialogOpenChange}
        sourceItems={pendingCopySelection}
        currentUserWorkspaceRoot={currentUserWorkspaceRoot}
        onConfirm={onCopyConfirm}
        isCopying={isCopying}
        mode={copyMoveDialogMode}
      />
      <EditTypeDialog
        open={editTypeDialogOpen}
        onOpenChange={(open) => {
          onEditTypeDialogOpenChange(open);
          if (!open && !isUpdatingType) setPendingEditTypeItem(null);
        }}
        item={pendingEditTypeItem}
        onConfirm={(newType) => onEditTypeConfirm(newType)}
        isUpdating={isUpdatingType}
      />
      <CreateFolderDialog
        open={newFolderDialogOpen}
        onOpenChange={onNewFolderDialogOpenChange}
        onCreateFolder={onCreateFolder}
        isCreating={isCreatingFolder}
      />
      <CreateWorkspaceDialog
        open={createWorkspaceDialogOpen}
        onOpenChange={onCreateWorkspaceDialogOpenChange}
        onCreateWorkspace={onCreateWorkspace}
        isCreating={isCreatingWorkspace}
      />
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={onUploadDialogOpenChange}
        targetPath={currentDirectoryPath}
        onUploadComplete={onUploadComplete}
      />
      <DownloadOptionsDialog
        open={downloadOptionsOpen}
        onOpenChange={onDownloadOptionsOpenChange}
        paths={downloadOptionsPaths}
        defaultArchiveName={downloadOptionsDefaultName}
        downloadMethods={workspaceDownload}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={onDeleteDialogOpenChange}>
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
      <AlertDialog
        open={fileViewerConstructionOpen}
        onOpenChange={onFileViewerConstructionOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="flex items-center justify-center gap-2">
              <Construction className="h-6 w-6 text-amber-600" />
            </AlertDialogMedia>
            <AlertDialogTitle>File viewer coming soon</AlertDialogTitle>
            <AlertDialogDescription>
              The file viewer is still under construction. Please check back at
              a later date for this feature.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>OK</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
