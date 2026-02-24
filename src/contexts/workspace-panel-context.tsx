"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface WorkspacePanelContextType {
  /** When true, user has manually hidden the details panel; don't auto-open on item selection or when traversing folders. */
  panelManuallyHidden: boolean;
  setPanelManuallyHidden: (value: boolean) => void;
  /** When true, show files/folders whose name starts with "." (persists across folder navigation). */
  showHiddenFiles: boolean;
  setShowHiddenFiles: (value: boolean) => void;
}

const WorkspacePanelContext = createContext<WorkspacePanelContextType | undefined>(undefined);

export function WorkspacePanelProvider({ children }: { children: ReactNode }) {
  const [panelManuallyHidden, setPanelManuallyHiddenState] = useState(false);
  const [showHiddenFiles, setShowHiddenFilesState] = useState(false);
  const setPanelManuallyHidden = useCallback((value: boolean) => {
    setPanelManuallyHiddenState(value);
  }, []);
  const setShowHiddenFiles = useCallback((value: boolean) => {
    setShowHiddenFilesState(value);
  }, []);

  return (
    <WorkspacePanelContext.Provider
      value={{
        panelManuallyHidden,
        setPanelManuallyHidden,
        showHiddenFiles,
        setShowHiddenFiles,
      }}
    >
      {children}
    </WorkspacePanelContext.Provider>
  );
}

export function useWorkspacePanel(): WorkspacePanelContextType {
  const ctx = useContext(WorkspacePanelContext);
  if (ctx === undefined) {
    throw new Error("useWorkspacePanel must be used within WorkspacePanelProvider");
  }
  return ctx;
}
