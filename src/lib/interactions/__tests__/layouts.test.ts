import Graph from "graphology";

import { connectedComponents, runGraphLayout } from "../layouts";
import type { LayoutName } from "../types";

function makeGraph() {
  const g = new Graph({ multi: true });
  ["hub", "a", "b", "c", "pair-1", "pair-2"].forEach((node, i) => {
    g.addNode(node, { x: i % 3, y: Math.floor(i / 3) });
  });
  g.addEdgeWithKey("hub-a", "hub", "a");
  g.addEdgeWithKey("hub-b", "hub", "b");
  g.addEdgeWithKey("hub-c", "hub", "c");
  g.addEdgeWithKey("pair", "pair-1", "pair-2");
  return g;
}

function expectFinitePositions(g: Graph) {
  g.forEachNode((node) => {
    expect(g.getNodeAttribute(node, "x")).toEqual(expect.any(Number));
    expect(g.getNodeAttribute(node, "y")).toEqual(expect.any(Number));
    expect(Number.isFinite(g.getNodeAttribute(node, "x") as number)).toBe(true);
    expect(Number.isFinite(g.getNodeAttribute(node, "y") as number)).toBe(true);
  });
}

describe("interaction graph layouts", () => {
  it("finds connected components without merging disconnected clusters", () => {
    const components = connectedComponents(makeGraph()).map((component) => component.sort());

    expect(components).toHaveLength(2);
    expect(components).toContainEqual(["a", "b", "c", "hub"]);
    expect(components).toContainEqual(["pair-1", "pair-2"]);
  });

  it.each<LayoutName>(["grid", "concentric", "dagre", "circular", "random", "forceatlas2", "cose-bilkent", "cola"])(
    "assigns finite positions for %s",
    (layout) => {
      const g = makeGraph();

      runGraphLayout(g, layout);

      expect(g.order).toBe(6);
      expect(g.size).toBe(4);
      expectFinitePositions(g);
    },
  );

  it("puts the unique highest-degree node at the centre of the concentric layout", () => {
    const g = makeGraph();

    runGraphLayout(g, "concentric");

    expect(g.getNodeAttribute("hub", "x")).toBeCloseTo(0);
    expect(g.getNodeAttribute("hub", "y")).toBeCloseTo(0);
  });
});
