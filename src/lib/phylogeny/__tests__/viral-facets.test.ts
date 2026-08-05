import type { PhyloFamilyBlock } from "@/lib/services/organisms/phylogeny";
import {
  filterViralTrees,
  flattenViralTrees,
  parseSegment,
  pruneViralFilters,
  sortedSegments,
  viralFacetCounts,
  type ViralFilters,
} from "../viral-facets";

const noFilters: ViralFilters = { strain: null, viewer: null, segments: new Set() };

const block: PhyloFamilyBlock = {
  order: ["b", "a"],
  groups: [
    { key: "a", title: "Strain A", archaeopteryx: [{ name: "segment 7 (M1, M2)", path: "/a.xml" }] },
    { key: "b", title: "Strain B", archaeopteryx: [{ name: "All concatenated", path: "/b.xml" }], nextstrain: [{ name: "segment 4 (HA)", path: "/b.json" }] },
  ],
};

describe("viral facets", () => {
  it.each([
    ["All concatenated", "All"],
    ["segment 7 (M1, M2)", "M1"],
    ["segment 8 (NS1, NEP)", "NS1"],
    ["segment without detail", null],
  ])("parses %s", (name, segment) => { expect(parseSegment(name)).toBe(segment); });

  it("flattens in configured group order and sorts known segments", () => {
    const trees = flattenViralTrees(block);
    expect(trees.map(tree => tree.groupKey)).toEqual(["b", "b", "a"]);
    expect(sortedSegments(trees)).toEqual(["All", "HA", "M1"]);
  });

  it("filters and prunes values invalidated by another facet", () => {
    const trees = flattenViralTrees(block);
    const filters = pruneViralFilters(trees, {
      strain: "a",
      viewer: "nextstrain",
      segments: new Set(["HA", "M1"]),
    });
    expect(filters.viewer).toBeNull();
    expect([...filters.segments]).toEqual(["M1"]);
    expect(filterViralTrees(trees, filters).map(tree => tree.ref.path)).toEqual(["/a.xml"]);
  });
});

describe("viralFacetCounts", () => {
  const trees = flattenViralTrees(block);

  it("counts every tree when nothing is filtered", () => {
    const counts = viralFacetCounts(trees, noFilters);
    expect(counts.allStrains).toBe(3);
    expect(counts.allViewers).toBe(3);
    expect(counts.strain("a")).toBe(1);
    expect(counts.viewer("archaeopteryx")).toBe(2);
    expect(counts.viewer("nextstrain")).toBe(1);
    expect(counts.segment("HA")).toBe(1);
  });

  it("returns zero for a viewer with no trees under the chosen strain", () => {
    // Strain A is Archaeopteryx-only, so Auspice is a dead end there.
    const counts = viralFacetCounts(trees, { ...noFilters, strain: "a" });
    expect(counts.viewer("nextstrain")).toBe(0);
    expect(counts.viewer("archaeopteryx")).toBe(1);
    expect(counts.allViewers).toBe(1);
  });

  it("narrows segment counts by both strain and viewer", () => {
    // Strain B has All (archaeopteryx) and HA (nextstrain).
    const strainOnly = viralFacetCounts(trees, { ...noFilters, strain: "b" });
    expect([strainOnly.segment("All"), strainOnly.segment("HA")]).toEqual([1, 1]);

    const withViewer = viralFacetCounts(trees, { ...noFilters, strain: "b", viewer: "nextstrain" });
    expect([withViewer.segment("All"), withViewer.segment("HA")]).toEqual([0, 1]);
  });

  it("ignores the segment filter so a checked segment never zeroes its own count", () => {
    // Segments are a union: checking HA must not make the others read 0 and
    // disable themselves, which would strand the user on one segment.
    const counts = viralFacetCounts(trees, { ...noFilters, segments: new Set(["HA"]) });
    expect(counts.segment("M1")).toBe(1);
    expect(counts.segment("All")).toBe(1);
  });

  it("leaves strain counts unconstrained by the chosen viewer", () => {
    // Otherwise picking Auspice would disable strain A and trap the user.
    const counts = viralFacetCounts(trees, { ...noFilters, viewer: "nextstrain" });
    expect(counts.strain("a")).toBe(1);
    expect(counts.strain("b")).toBe(2);
  });

  it("reports zero for unknown keys and handles an empty tree list", () => {
    expect(viralFacetCounts(trees, noFilters).strain("missing")).toBe(0);
    expect(viralFacetCounts(trees, noFilters).segment("ZZ")).toBe(0);

    const empty = viralFacetCounts([], noFilters);
    expect([empty.allStrains, empty.allViewers, empty.viewer("archaeopteryx")]).toEqual([0, 0, 0]);
  });

  it("agrees with pruneViralFilters: a zero-count option is one prune would drop", () => {
    // The counts exist to pre-empt the prune, so the two must not disagree.
    const filters: ViralFilters = { ...noFilters, strain: "a" };
    expect(viralFacetCounts(trees, filters).viewer("nextstrain")).toBe(0);
    expect(pruneViralFilters(trees, { ...filters, viewer: "nextstrain" }).viewer).toBeNull();
  });
});
