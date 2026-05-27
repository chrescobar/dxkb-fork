"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

const debugModeStorageKey = "dxkb:service-debug-mode";

interface ServiceDebuggingContextType {
  isDebugMode: boolean;
  containerBuildId: string;
  setIsDebugMode: (value: boolean) => void;
  setContainerBuildId: (value: string) => void;
}

const ServiceDebuggingContext = createContext<ServiceDebuggingContextType | undefined>(undefined);

interface ServiceDebuggingProviderProps {
  children: ReactNode;
}

function readDebugModeFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(debugModeStorageKey) === "true";
  } catch {
    return false;
  }
}

export function ServiceDebuggingProvider({ children }: ServiceDebuggingProviderProps) {
  // Lazy init so SSR returns false and the client hydration matches whatever
  // the user previously persisted via the DebuggingPanel checkbox. E2E tests
  // seed this key via page.addInitScript before navigation so the form
  // short-circuits to JobParamsDialog on submit instead of POSTing.
  const [isDebugMode, setIsDebugModeState] = useState<boolean>(readDebugModeFromStorage);
  const [containerBuildId, setContainerBuildId] = useState("");

  const setIsDebugMode = useCallback((value: boolean) => {
    setIsDebugModeState(value);
    if (typeof window === "undefined") return;
    try {
      if (value) {
        window.localStorage.setItem(debugModeStorageKey, "true");
      } else {
        window.localStorage.removeItem(debugModeStorageKey);
      }
    } catch {
      // localStorage can throw in private-browsing / quota-exceeded edge
      // cases; the context still works in-memory for this session.
    }
  }, []);

  return (
    <ServiceDebuggingContext.Provider
      value={{
        isDebugMode,
        containerBuildId,
        setIsDebugMode,
        setContainerBuildId,
      }}
    >
      {children}
    </ServiceDebuggingContext.Provider>
  );
}

export function useServiceDebugging() {
  const context = useContext(ServiceDebuggingContext);
  if (context === undefined) {
    throw new Error("useServiceDebugging must be used within a ServiceDebuggingProvider");
  }
  return context;
}
