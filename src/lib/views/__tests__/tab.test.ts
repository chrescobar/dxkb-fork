import { resolveTab } from "../tab";

describe("resolveTab", () => {
  const valid = ["overview", "genomes", "features"];
  it("returns the requested tab when valid", () => {
    expect(resolveTab("genomes", valid, "overview")).toBe("genomes");
  });
  it("returns the default when the tab is missing", () => {
    expect(resolveTab(undefined, valid, "overview")).toBe("overview");
  });
  it("returns the default when the tab is not in the valid set", () => {
    expect(resolveTab("bogus", valid, "overview")).toBe("overview");
  });
  it("takes the first value when given an array", () => {
    expect(resolveTab(["features", "genomes"], valid, "overview")).toBe("features");
  });
});
