import { firstRowFromApiShape } from "../genome-detail-panel";

describe("firstRowFromApiShape", () => {
  // Regression: an empty array (id matched no row in the queried core, e.g. a
  // sequence-shaped id under the genome core) previously returned data[0] ===
  // undefined, which TanStack Query rejects with "Query data cannot be
  // undefined". Must be null.
  it("returns null (never undefined) for an empty array", () => {
    const result = firstRowFromApiShape([]);
    expect(result).toBeNull();
    expect(result).not.toBeUndefined();
  });

  it("returns the first row of a bare array", () => {
    expect(firstRowFromApiShape([{ genome_id: "1.1" }, { genome_id: "2.2" }])).toEqual({
      genome_id: "1.1",
    });
  });

  it("returns the first item from an {items} shape, null when empty", () => {
    expect(firstRowFromApiShape({ items: [{ sequence_id: "s1" }] })).toEqual({
      sequence_id: "s1",
    });
    expect(firstRowFromApiShape({ items: [] })).toBeNull();
  });

  it("returns the first doc from a Solr {response:{docs}} shape, null when empty", () => {
    expect(
      firstRowFromApiShape({ response: { docs: [{ accession: "ABC" }] } }),
    ).toEqual({ accession: "ABC" });
    expect(firstRowFromApiShape({ response: { docs: [] } })).toBeNull();
  });

  it("returns null when the object has neither items nor docs", () => {
    expect(firstRowFromApiShape({})).toBeNull();
  });
});
