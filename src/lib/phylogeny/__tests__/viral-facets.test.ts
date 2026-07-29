import type { PhyloFamilyBlock } from "@/lib/services/organisms/phylogeny";
import { filterViralTrees, flattenViralTrees, parseSegment, pruneViralFilters, sortedSegments } from "../viral-facets";

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
