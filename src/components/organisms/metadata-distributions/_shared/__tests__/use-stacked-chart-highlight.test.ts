import { act, renderHook } from "@testing-library/react";

import { useStackedChartHighlight } from "../use-stacked-chart-highlight";

describe("useStackedChartHighlight", () => {
  it("starts with no active highlight", () => {
    const { result } = renderHook(() => useStackedChartHighlight());
    expect(result.current.activeIdx).toBeNull();
    expect(result.current.isLocked).toBe(false);
    expect(result.current.pressedFor(0)).toBe(false);
  });

  it("activatePill sets the active index without locking", () => {
    const { result } = renderHook(() => useStackedChartHighlight());
    act(() => result.current.activatePill(2));
    expect(result.current.activeIdx).toBe(2);
    expect(result.current.isLocked).toBe(false);
    expect(result.current.pressedFor(2)).toBe(false);
  });

  it("deactivatePill clears the unlocked highlight", () => {
    const { result } = renderHook(() => useStackedChartHighlight());
    act(() => result.current.activatePill(1));
    act(() => result.current.deactivatePill());
    expect(result.current.activeIdx).toBeNull();
  });

  it("togglePillLock locks the pill and pressedFor reflects it", () => {
    const { result } = renderHook(() => useStackedChartHighlight());
    act(() => result.current.togglePillLock(3));
    expect(result.current.activeIdx).toBe(3);
    expect(result.current.isLocked).toBe(true);
    expect(result.current.pressedFor(3)).toBe(true);
    expect(result.current.pressedFor(2)).toBe(false);
  });

  it("togglePillLock toggles the same pill off", () => {
    const { result } = renderHook(() => useStackedChartHighlight());
    act(() => result.current.togglePillLock(3));
    act(() => result.current.togglePillLock(3));
    expect(result.current.activeIdx).toBeNull();
    expect(result.current.isLocked).toBe(false);
  });

  it("togglePillLock swaps to a different locked pill", () => {
    const { result } = renderHook(() => useStackedChartHighlight());
    act(() => result.current.togglePillLock(1));
    act(() => result.current.togglePillLock(4));
    expect(result.current.activeIdx).toBe(4);
    expect(result.current.isLocked).toBe(true);
  });

  it("activatePill is a no-op while locked", () => {
    const { result } = renderHook(() => useStackedChartHighlight());
    act(() => result.current.togglePillLock(1));
    act(() => result.current.activatePill(2));
    expect(result.current.activeIdx).toBe(1);
    expect(result.current.isLocked).toBe(true);
  });

  it("deactivatePill is a no-op while locked", () => {
    const { result } = renderHook(() => useStackedChartHighlight());
    act(() => result.current.togglePillLock(1));
    act(() => result.current.deactivatePill());
    expect(result.current.activeIdx).toBe(1);
    expect(result.current.isLocked).toBe(true);
  });

  it("clearHighlight resets even when locked", () => {
    const { result } = renderHook(() => useStackedChartHighlight());
    act(() => result.current.togglePillLock(1));
    act(() => result.current.clearHighlight());
    expect(result.current.activeIdx).toBeNull();
    expect(result.current.isLocked).toBe(false);
  });
});
