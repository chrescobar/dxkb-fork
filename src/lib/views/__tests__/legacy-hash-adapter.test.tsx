// src/lib/views/__tests__/legacy-hash-adapter.test.tsx
import { render } from "@testing-library/react";

const replaceStateSpy = vi.fn();

beforeEach(() => {
  replaceStateSpy.mockClear();
  window.history.replaceState = replaceStateSpy;
});

import { LegacyHashAdapter } from "../legacy-hash-adapter";

it("rewrites #view_tab= to ?tab= via replaceState", () => {
  window.location.hash = "#view_tab=features";
  render(<LegacyHashAdapter />);
  expect(replaceStateSpy).toHaveBeenCalled();
  const url = String(replaceStateSpy.mock.calls[0][2]);
  expect(url).toContain("tab=features");
  expect(url).not.toContain("view_tab");
});

it("does nothing when there is no legacy hash", () => {
  window.location.hash = "";
  render(<LegacyHashAdapter />);
  expect(replaceStateSpy).not.toHaveBeenCalled();
});

it("promotes a non-false filter to ?filter=", () => {
  window.location.hash = "#view_tab=overview&filter=true";
  render(<LegacyHashAdapter />);
  expect(replaceStateSpy).toHaveBeenCalled();
  const url = String(replaceStateSpy.mock.calls[0][2]);
  expect(url).toContain("tab=overview");
  expect(url).toContain("filter=true");
  expect(url).not.toContain("view_tab");
});

it("does not promote filter=false (legacy default-off sentinel)", () => {
  window.location.hash = "#view_tab=overview&filter=false";
  render(<LegacyHashAdapter />);
  expect(replaceStateSpy).toHaveBeenCalled();
  const url = String(replaceStateSpy.mock.calls[0][2]);
  expect(url).toContain("tab=overview");
  expect(url).not.toContain("filter");
});
