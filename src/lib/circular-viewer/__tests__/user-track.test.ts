import { keepAccessions, parseUserTrack, userScoreScale } from "../user-track";

describe("parseUserTrack", () => {
  it("reads tiles from accession, start and end, skipping unreadable lines", () => {
    const parsed = parseUserTrack(
      "accession\tstart\tend\nNC_000962\t2052\t3260\r\nNC_000962\t34\t1524\n\nbad line",
      "tiles",
    );
    expect(parsed.items).toEqual([
      { accession: "NC_000962", start: 34, end: 1524, score: null },
      { accession: "NC_000962", start: 2052, end: 3260, score: null },
    ]);
    expect(parsed.skipped).toBe(2);
  });

  it("needs a score for a line, histogram or heatmap", () => {
    const parsed = parseUserTrack("A\t1\t10\nA\t11\t20\t0.5\nA\t21\t30\tNaN", "histogram");
    expect(parsed.items).toEqual([{ accession: "A", start: 11, end: 20, score: 0.5 }]);
    expect(parsed.skipped).toBe(2);
  });

  it("drops a row whose end precedes its start", () => {
    expect(parseUserTrack("A\t20\t10\t1", "line").items).toEqual([]);
  });

  it("normalizes the score range as legacy did", () => {
    expect(parseUserTrack("A\t1\t2\t0.2\nA\t3\t4\t0.8", "line").scale).toEqual({ min: 0, max: 1 });
  });
});

describe("userScoreScale", () => {
  it.each([
    [0, 0.8, { min: 0, max: 1 }],
    [-0.5, 0.9, { min: -1, max: 1 }],
    [0, 7, { min: 0, max: 7 }],
    [-3, 2, { min: -3, max: 3 }],
    [-5, 0, { min: -5, max: 5 }],
  ])("reads [%f, %f] as %o", (min, max, scale) => {
    expect(userScoreScale(min, max)).toEqual(scale);
  });
});

describe("keepAccessions", () => {
  it("drops rows off the drawn sequences and rescales without them", () => {
    const parsed = parseUserTrack("A\t1\t10\t0.5\nZ\t1\t10\t40\nbad", "line");
    expect(parsed.scale).toEqual({ min: 0, max: 40 });
    expect(keepAccessions(parsed, new Set(["A"]))).toEqual({
      parsed: { items: [{ accession: "A", start: 1, end: 10, score: 0.5 }], scale: { min: 0, max: 1 }, skipped: 1 },
      dropped: 1,
    });
  });

  it("returns the parse unchanged when every row is on a drawn sequence", () => {
    const parsed = parseUserTrack("A\t1\t10\nB\t5\t9", "tiles");
    const kept = keepAccessions(parsed, new Set(["A", "B"]));
    expect(kept.dropped).toBe(0);
    expect(kept.parsed).toBe(parsed);
  });

  it("can drop every row", () => {
    const kept = keepAccessions(parseUserTrack("Z\t1\t10", "tiles"), new Set(["A"]));
    expect(kept.parsed.items).toEqual([]);
    expect(kept.dropped).toBe(1);
  });
});
