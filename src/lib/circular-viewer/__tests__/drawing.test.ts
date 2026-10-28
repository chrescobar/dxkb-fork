import type { CircularFeature } from "../contract";
import { buildTrackDrawings, createDrawingCache, hitTest, type TrackData } from "../drawing";
import { buildGenomeLayout, toPolar } from "../layout";
import { defaultTracks } from "../tracks";

const layout = buildGenomeLayout([{ accession: "A", length: 1000 }]);
const feature = (featureId: string, start: number, end: number): CircularFeature => ({
  featureId, accession: "A", start, end, strand: "+", featureType: "CDS",
});
const byId = (id: string) => {
  const track = defaultTracks().find((item) => item.id === id);
  if (!track) throw new Error(`no default track ${id}`);
  return track;
};

describe("buildTrackDrawings", () => {
  it("draws a feature track as one path and drops features off the genome", () => {
    const data = new Map<string, TrackData>([
      ["cds-forward", { status: "ready", items: { kind: "features", truncated: false, features: [
        feature("F1", 1, 250), feature("F2", 501, 750), { ...feature("F3", 1, 10), accession: "B" },
      ] } }],
    ]);
    const [drawing] = buildTrackDrawings([byId("cds-forward")], data, layout, 300);
    expect(drawing.body.kind).toBe("marks");
    if (drawing.body.kind !== "marks") return;
    expect(drawing.body.layers).toHaveLength(1);
    expect(drawing.body.layers[0].d.match(/M/g)).toHaveLength(2);
    expect(drawing.body.hits?.spans).toHaveLength(2);
  });

  it("shows a pending and a failed track as such", () => {
    const data = new Map<string, TrackData>([
      ["amr", { status: "pending" }],
      ["vf", { status: "error", error: new Error("boom") }],
    ]);
    const drawings = buildTrackDrawings([byId("amr"), byId("vf")], data, layout, 300);
    expect(drawings.map((drawing) => drawing.body.kind)).toEqual(["pending", "failed"]);
  });

  it("labels positions from the layout alone, with guide circles only on scored rings", () => {
    const data = new Map<string, TrackData>([
      ["gc-content", { status: "ready", items: { kind: "scores", points: [
        { accession: "A", start: 0, end: 500, score: 0.4 },
        { accession: "A", start: 500, end: 1000, score: 0.6 },
      ] } }],
    ]);
    const [labels, gc] = buildTrackDrawings([byId("labels"), byId("gc-content")], data, layout, 300);
    expect(labels.body.kind).toBe("labels");
    expect(labels.grid).toEqual([]);
    expect(gc.grid).toHaveLength(3);
    expect(gc.paint).toBe("stroke");
    expect(gc.backgroundPath).not.toBe("");
  });

  it("splits a heatmap into one layer per color", () => {
    const heat = { ...byId("gc-content"), id: "heat", plot: "heatmap" as const, scale: { min: 0, max: 1 } };
    const data = new Map<string, TrackData>([
      ["heat", { status: "ready", items: { kind: "scores", points: [
        { accession: "A", start: 0, end: 100, score: 0.05 },
        { accession: "A", start: 100, end: 200, score: 0.07 },
        { accession: "A", start: 200, end: 300, score: 0.95 },
      ] } }],
    ]);
    const [drawing] = buildTrackDrawings([heat], data, layout, 300);
    if (drawing.body.kind !== "marks") throw new Error("expected marks");
    expect(drawing.body.layers.map((layer) => layer.color)).toEqual(["#FFEBEE", "#B71C1C"]);
  });
});

describe("buildTrackDrawings with a cache", () => {
  const items = { kind: "features" as const, truncated: false, features: [feature("F1", 1, 250)] };
  const data = new Map<string, TrackData>([
    ["cds-forward", { status: "ready", items }],
    ["cds-reverse", { status: "ready", items: { ...items, features: [feature("R1", 501, 750)] } }],
  ]);

  it("keeps an unchanged track's drawing when another track's color changes", () => {
    const cache = createDrawingCache();
    const tracks = [byId("cds-forward"), byId("cds-reverse")];
    const before = buildTrackDrawings(tracks, data, layout, 300, cache);
    const recolored = [tracks[0], { ...tracks[1], foreground: "#123456" }];
    // A new map with new answers, as each render builds them, around the same items.
    const after = buildTrackDrawings(recolored, new Map(data), layout, 300, cache);
    expect(after[0]).toBe(before[0]);
    expect(after[1]).not.toBe(before[1]);
    if (after[1].body.kind !== "marks") throw new Error("expected marks");
    expect(after[1].body.layers[0].color).toBe("#123456");
  });

  it("redraws a track whose answer, layout or radius changed", () => {
    const cache = createDrawingCache();
    const tracks = [byId("cds-forward")];
    const [first] = buildTrackDrawings(tracks, data, layout, 300, cache);
    const [pending] = buildTrackDrawings(tracks, new Map([["cds-forward", { status: "pending" as const }]]), layout, 300, cache);
    expect(pending).not.toBe(first);
    // Two pending answers draw alike, though they are not one object.
    expect(buildTrackDrawings(tracks, new Map(), layout, 300, cache)[0]).toBe(pending);
    const [ready] = buildTrackDrawings(tracks, data, layout, 300, cache);
    expect(buildTrackDrawings(tracks, data, layout, 200, cache)[0]).not.toBe(ready);
    const other = buildGenomeLayout([{ accession: "A", length: 2000 }]);
    expect(buildTrackDrawings(tracks, data, other, 200, cache)[0]).not.toBe(ready);
  });

  it("marks the dark-theme defaults' layers as themed, and no others", () => {
    const contigs = new Map<string, TrackData>([
      ["contigs", { status: "ready", items: { kind: "contigs", contigs: [{ accession: "A", sequenceId: "s", length: 1000 }] } }],
      ...data,
    ]);
    const drawings = buildTrackDrawings([byId("contigs"), byId("cds-forward")], contigs, layout, 300);
    expect(
      drawings.map((drawing) => (drawing.body.kind === "marks" ? drawing.body.layers.map((layer) => layer.themed) : null)),
    ).toEqual([[true], [false]]);
  });
});

describe("hitTest", () => {
  const data = new Map<string, TrackData>([
    ["cds-forward", { status: "ready", items: { kind: "features", truncated: false, features: [feature("F1", 1, 500)] } }],
  ]);
  const [drawing] = buildTrackDrawings([byId("cds-forward")], data, layout, 300);
  const middle = (drawing.ring.innerRadius + drawing.ring.outerRadius) / 2;

  it("names the feature under the pointer inside its ring", () => {
    // 3 o'clock: a quarter of the way round, inside F1 (the first half).
    const hit = hitTest([drawing], toPolar(middle, 0));
    expect(hit).toMatchObject({ trackId: "cds-forward", item: { kind: "feature", feature: { featureId: "F1" } } });
    expect(hit?.path).toMatch(/^M/);
  });

  it("answers nothing outside the ring, past the feature, or on a hidden track", () => {
    expect(hitTest([drawing], toPolar(drawing.ring.outerRadius + 3, 0))).toBeNull();
    expect(hitTest([drawing], toPolar(-middle, 0))).toBeNull();
    expect(hitTest([{ ...drawing, visible: false }], toPolar(middle, 0))).toBeNull();
  });
});
