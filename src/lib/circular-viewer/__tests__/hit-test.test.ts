import { indexSpans, spanAt } from "../hit-test";

const index = indexSpans([
  { startAngle: 2, endAngle: 3, index: 1 },
  { startAngle: 0, endAngle: 1, index: 0 },
  { startAngle: 2.5, endAngle: 2.6, index: 2 },
]);

describe("spanAt", () => {
  it("finds the span under the angle, preferring the one that starts last", () => {
    expect(spanAt(index, 0.5, 0)?.index).toBe(0);
    expect(spanAt(index, 2.55, 0)?.index).toBe(2);
    expect(spanAt(index, 2.8, 0)?.index).toBe(1);
  });

  it("reaches a sub-pixel span within the tolerance and nothing beyond it", () => {
    expect(spanAt(index, 1.05, 0.1)?.index).toBe(0);
    expect(spanAt(index, 1.5, 0.1)).toBeUndefined();
  });

  it("answers nothing for an empty track", () => {
    expect(spanAt(indexSpans([]), 1, 1)).toBeUndefined();
  });
});
