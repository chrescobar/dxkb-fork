import {
  firstRowFromApiShape,
  detailPanelQueryKey,
} from "../genome-detail-panel-utils";

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
    expect(
      firstRowFromApiShape([{ genome_id: "1.1" }, { genome_id: "2.2" }]),
    ).toEqual({
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

// Regression: the cache pre-population in list-data.tsx (setQueryData) and the cache
// read in GenomeDetailPanel (useQuery) must use identical keys. If the key format
// diverges between the two call sites, setQueryData writes to a key that useQuery
// never reads — cache miss returns, loading flash comes back.
//
// Both sides now import detailPanelQueryKey from this module (single source of truth).
// This test pins the expected shape so a future refactor that changes the key format
// fails loudly here rather than silently as a UI regression.
describe("detailPanelQueryKey", () => {
  it("returns the expected three-element tuple", () => {
    expect(detailPanelQueryKey("genome_sequence", "94625.28.con.0340")).toEqual(
      ["selected-row", "genome_sequence", "94625.28.con.0340"],
    );
  });

  it("varies by resource so genome and genome_sequence panels cache independently", () => {
    const a = detailPanelQueryKey("genome", "35802.26");
    const b = detailPanelQueryKey("genome_sequence", "35802.26");
    expect(a).not.toEqual(b);
  });

  it("varies by id so different rows cache independently", () => {
    const a = detailPanelQueryKey("genome", "35802.26");
    const b = detailPanelQueryKey("genome", "235.199");
    expect(a).not.toEqual(b);
  });
});
