import { renderHook, act } from "@testing-library/react";
import React from "react";

import {
  ServiceDebuggingProvider,
  useServiceDebugging,
} from "../service-debugging-context";

const debugModeStorageKey = "dxkb:service-debug-mode";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ServiceDebuggingProvider>{children}</ServiceDebuggingProvider>
);

describe("ServiceDebuggingContext", () => {
  beforeEach(() => {
    window.localStorage.removeItem(debugModeStorageKey);
  });

  it("useServiceDebugging throws outside provider", () => {
    expect(() => renderHook(() => useServiceDebugging())).toThrow(
      "useServiceDebugging must be used within a ServiceDebuggingProvider",
    );
  });

  it("provides default values", () => {
    const { result } = renderHook(() => useServiceDebugging(), { wrapper });

    expect(result.current.isDebugMode).toBe(false);
    expect(result.current.containerBuildId).toBe("");
  });

  it("setIsDebugMode toggles debug mode", () => {
    const { result } = renderHook(() => useServiceDebugging(), { wrapper });

    act(() => {
      result.current.setIsDebugMode(true);
    });

    expect(result.current.isDebugMode).toBe(true);

    act(() => {
      result.current.setIsDebugMode(false);
    });

    expect(result.current.isDebugMode).toBe(false);
  });

  it("setContainerBuildId updates value", () => {
    const { result } = renderHook(() => useServiceDebugging(), { wrapper });

    act(() => {
      result.current.setContainerBuildId("build-123");
    });

    expect(result.current.containerBuildId).toBe("build-123");
  });

  it("hydrates isDebugMode from localStorage on mount", () => {
    window.localStorage.setItem(debugModeStorageKey, "true");

    const { result } = renderHook(() => useServiceDebugging(), { wrapper });

    expect(result.current.isDebugMode).toBe(true);
  });

  it("does not hydrate when the storage key holds a non-'true' value", () => {
    window.localStorage.setItem(debugModeStorageKey, "1");

    const { result } = renderHook(() => useServiceDebugging(), { wrapper });

    expect(result.current.isDebugMode).toBe(false);
  });

  it("persists setIsDebugMode(true) to localStorage", () => {
    const { result } = renderHook(() => useServiceDebugging(), { wrapper });

    act(() => {
      result.current.setIsDebugMode(true);
    });

    expect(window.localStorage.getItem(debugModeStorageKey)).toBe("true");
  });

  it("clears the storage key when setIsDebugMode(false) is called", () => {
    window.localStorage.setItem(debugModeStorageKey, "true");
    const { result } = renderHook(() => useServiceDebugging(), { wrapper });

    act(() => {
      result.current.setIsDebugMode(false);
    });

    expect(window.localStorage.getItem(debugModeStorageKey)).toBeNull();
  });
});
