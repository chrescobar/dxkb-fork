import { toGraph } from "../to-graph";
import type { PpiRecord } from "../types";

function makeRow(overrides: Partial<PpiRecord> = {}): PpiRecord {
  return {
    id: "ppi-1",
    interactor_a: "A",
    interactor_b: "B",
    domain_a: "Bacteria",
    domain_b: "Homo sapiens",
    evidence: "experimental",
    interaction_type: "predicted interaction",
    detection_method: "predictive text mining",
    ...overrides,
  };
}

describe("toGraph", () => {
  it("dedups nodes to unique interactors", () => {
    const rows = [
      makeRow({ id: "ppi-1", interactor_a: "A", interactor_b: "B" }),
      makeRow({ id: "ppi-2", interactor_a: "A", interactor_b: "C" }),
    ];
    const { nodes } = toGraph(rows);
    expect(nodes).toHaveLength(3);
  });

  it("classifies Bacteria domain as microbial", () => {
    const { nodes } = toGraph([makeRow({ domain_a: "Bacteria" })]);
    expect(nodes.find((n) => n.id === "A")).toEqual(
      expect.objectContaining({ kind: "microbial" }),
    );
  });

  it("classifies a non-pathogen domain as host", () => {
    const { nodes } = toGraph([makeRow({ domain_b: "Homo sapiens" })]);
    expect(nodes.find((n) => n.id === "B")).toEqual(
      expect.objectContaining({ kind: "host" }),
    );
  });

  it("defaults a missing domain to microbial", () => {
    const { nodes } = toGraph([makeRow({ domain_a: undefined })]);
    expect(nodes.find((n) => n.id === "A")).toEqual(
      expect.objectContaining({ kind: "microbial" }),
    );
  });

  it("treats a scalar 'experimental' evidence string as experimental", () => {
    const { edges } = toGraph([makeRow({ evidence: "experimental" })]);
    expect(edges[0]).toEqual(expect.objectContaining({ experimental: true }));
  });

  it("treats an array evidence field containing 'experimental' as experimental", () => {
    const { edges } = toGraph([makeRow({ evidence: ["experimental"] })]);
    expect(edges[0]).toEqual(expect.objectContaining({ experimental: true }));
  });

  it("returns empty nodes and edges for empty input", () => {
    expect(toGraph([])).toEqual({ nodes: [], edges: [] });
  });

  it("keeps multiple edges between the same node pair", () => {
    const rows = [
      makeRow({ id: "ppi-1", interactor_a: "A", interactor_b: "B" }),
      makeRow({ id: "ppi-2", interactor_a: "A", interactor_b: "B" }),
    ];
    const { edges } = toGraph(rows);
    expect(edges).toHaveLength(2);
  });
});
