import {
  canonicalDatasetId,
  datasetFilename,
  maxDatasetIdLength,
  parseDatasetId,
  stripViewerPrefix,
  viewerUrl,
} from "../nextstrain-dataset";

describe("Nextstrain dataset identifiers", () => {
  it("accepts published identifiers and normalizes outer slashes", () => {
    expect(parseDatasetId("Influenza-A-Virus/H3N2/HA")).toEqual([
      "Influenza-A-Virus",
      "H3N2",
      "HA",
    ]);
    expect(parseDatasetId("/Orthoebolavirus/100/")).toEqual([
      "Orthoebolavirus",
      "100",
    ]);
  });

  it.each([
    "https://example.org/tree",
    "//example.org/tree",
    "///example.org/tree",
    "scheme:tree",
    "tree?x=1",
    "tree#fragment",
    "../tree",
    "tree/../other",
    "tree\\other",
    "tree//other",
    "tree_name",
    "tree\u0000name",
    "a/b/c/d/e/f/g/h/i",
  ])("rejects invalid identifier %j", (value) => {
    expect(parseDatasetId(value)).toBeNull();
  });

  it("enforces identifier length and segment limits", () => {
    expect(parseDatasetId("a".repeat(maxDatasetIdLength))).not.toBeNull();
    expect(parseDatasetId("a".repeat(maxDatasetIdLength + 1))).toBeNull();
    expect(parseDatasetId("a/b/c/d/e/f/g/h")).toHaveLength(8);
    expect(parseDatasetId("a/b/c/d/e/f/g/h/i")).toBeNull();
    expect(parseDatasetId("/")).toBeNull();
  });

  it("returns one canonical case-sensitive identifier", () => {
    expect(canonicalDatasetId("/Orthoebolavirus/100/")).toBe(
      "Orthoebolavirus/100",
    );
    expect(canonicalDatasetId("influenza/H3N2/HA")).toBe("influenza/H3N2/HA");
    expect(canonicalDatasetId("//example.org/tree")).toBeNull();
  });

  it("maps exact dataset and sidecar filenames", () => {
    const parts = ["Influenza-A-Virus", "H3N2", "HA"];
    expect(datasetFilename(parts)).toBe("Influenza-A-Virus_H3N2_HA.json");
    expect(datasetFilename(parts, "root-sequence")).toBe(
      "Influenza-A-Virus_H3N2_HA_root-sequence.json",
    );
  });

  it("constructs a viewer URL from encoded segments", () => {
    expect(viewerUrl("Influenza-A-Virus/H3N2/HA")).toBe(
      "/nextstrain-viewer/Influenza-A-Virus/H3N2/HA",
    );
    expect(viewerUrl("not_valid")).toBeNull();
  });

  it("strips exactly one viewer mount segment", () => {
    expect(stripViewerPrefix("/nextstrain-viewer/Orthoebolavirus/100")).toBe(
      "Orthoebolavirus/100",
    );
    expect(stripViewerPrefix("nextstrain-viewer/nextstrain-viewer/x")).toBe(
      "nextstrain-viewer/x",
    );
  });
});
