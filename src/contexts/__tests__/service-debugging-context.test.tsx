import { renderHook, act } from "@testing-library/react";
import React from "react";

import {
  ServiceDebuggingProvider,
  useServiceDebugging,
} from "../service-debugging-context";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ServiceDebuggingProvider>{children}</ServiceDebuggingProvider>
);

describe("ServiceDebuggingContext", () => {
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
});
