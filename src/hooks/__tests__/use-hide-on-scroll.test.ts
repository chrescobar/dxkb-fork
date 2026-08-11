import { act, renderHook } from "@testing-library/react";

import { useHideOnScroll } from "../use-hide-on-scroll";

function setScroll(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true, writable: true });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

function setElementScroll(element: Element, y: number) {
  Object.defineProperty(element, "scrollTop", { value: y, configurable: true, writable: true });
  act(() => {
    element.dispatchEvent(new Event("scroll"));
  });
}

beforeEach(() => {
  Object.defineProperty(window, "scrollY", { value: 0, configurable: true, writable: true });
});

it("defaults to visible", () => {
  const { result } = renderHook(() => useHideOnScroll());
  expect(result.current).toBe(false);
});

it("hides after scrolling down past the 60px floor", () => {
  const { result } = renderHook(() => useHideOnScroll());
  setScroll(200);
  expect(result.current).toBe(true);
});

it("reveals again when scrolling back up", () => {
  const { result } = renderHook(() => useHideOnScroll());
  setScroll(200);
  expect(result.current).toBe(true);
  setScroll(120);
  expect(result.current).toBe(false);
});

it("tracks a nested scroll region", () => {
  const region = document.createElement("div");
  document.body.append(region);
  const { result } = renderHook(() => useHideOnScroll());

  setElementScroll(region, 200);
  expect(result.current).toBe(true);
  setElementScroll(region, 120);
  expect(result.current).toBe(false);

  region.remove();
});

it("tracks window and nested scroll positions independently", () => {
  const region = document.createElement("div");
  document.body.append(region);
  const { result } = renderHook(() => useHideOnScroll());

  setScroll(200);
  expect(result.current).toBe(true);
  setElementScroll(region, 100);
  expect(result.current).toBe(true);
  setScroll(120);
  expect(result.current).toBe(false);

  region.remove();
});

it("stays visible within the first 60px even when scrolling down", () => {
  const { result } = renderHook(() => useHideOnScroll());
  setScroll(40);
  expect(result.current).toBe(false);
});

it("forceShow pins it visible regardless of scroll", () => {
  const { result } = renderHook(() => useHideOnScroll(true));
  setScroll(500);
  expect(result.current).toBe(false);
});

it("stays visible after a forced-visible scroll region closes", () => {
  const region = document.createElement("div");
  document.body.append(region);
  const { result, rerender } = renderHook(({ forceShow }) => useHideOnScroll(forceShow), { initialProps: { forceShow: false } });

  setElementScroll(region, 200);
  expect(result.current).toBe(true);
  rerender({ forceShow: true });
  setElementScroll(region, 300);
  rerender({ forceShow: false });
  expect(result.current).toBe(false);

  region.remove();
});
