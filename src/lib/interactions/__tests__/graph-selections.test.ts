import { buildGraphSelectionIndex, selectHubs, selectSubgraphs } from "../graph-selections";
import type { GEdge, GNode } from "../types";

const nodes = ["a", "b", "c", "d", "e", "f", "x", "y"].map((id): GNode => ({
  id,
  kind: "microbial",
}));
const pairs = [
  ["a", "b"], ["a", "c"], ["a", "d"], ["a", "e"], ["a", "f"], ["b", "c"], ["x", "y"],
] as const;
const edges = pairs.map(([source, target], index): GEdge => ({
  id: `e${String(index)}`,
  source,
  target,
  evidence: "",
  interactionType: "",
  detectionMethod: "",
  experimental: false,
}));
const index = buildGraphSelectionIndex(nodes, edges);

describe("graph selections", () => {
  it("selects all nodes and internal edges in components strictly larger than the legacy threshold", () => {
    const selected = selectSubgraphs(index, 5);
    expect(selected.nodes.map((node) => node.id)).toEqual(expect.arrayContaining(["a", "b", "c", "d", "e", "f"]));
    expect(selected.nodes).toHaveLength(6);
    expect(selected.edges).toHaveLength(6);
  });

  it("selects one largest component when multiple components tie", () => {
    const tiedNodes = ["a", "b", "x", "y"].map((id): GNode => ({ id, kind: "microbial" }));
    const tiedEdges = edges.filter((edge) => edge.id === "e0" || edge.id === "e6");
    const selected = selectSubgraphs(buildGraphSelectionIndex(tiedNodes, tiedEdges), "max");
    expect(selected.nodes).toHaveLength(2);
    expect(selected.edges).toHaveLength(1);
  });

  it("counts unique neighbors instead of parallel interactions for hub thresholds", () => {
    const parallel = { ...edges[0], id: "parallel" };
    const selected = selectHubs(buildGraphSelectionIndex(nodes, [...edges, parallel]), 5);
    expect(selected.nodes.map((node) => node.id)).toEqual(["a"]);
    expect(selected.edges).toEqual([]);
  });

  it("selects every protein tied for most connected", () => {
    const selected = selectHubs(index, "max");
    expect(selected.nodes.map((node) => node.id)).toEqual(["a"]);
  });
});
