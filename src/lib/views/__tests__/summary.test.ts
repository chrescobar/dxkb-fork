import { describe, expect, it } from "vitest";
import { displaySummary } from "../summary";

describe("displaySummary", () => {
  it.each([
    ["result", "result"],
    [42, "42"],
    [false, "false"],
    [BigInt(1), "1"],
  ])("formats scalar value %s", (value, expected) => {
    expect(displaySummary(value)).toBe(expected);
  });

  it("formats arrays of scalar values", () => {
    expect(displaySummary(["positive", 2, false, null, {}])).toBe(
      "positive, 2, false",
    );
  });

  it("omits empty strings from arrays", () => {
    expect(displaySummary(["", "positive", ""])).toBe("positive");
  });

  it.each(["", null, undefined, {}, [], ["", ""]])(
    "uses the fallback for unavailable value %s",
    (value) => {
      expect(displaySummary(value)).toBe("Not available");
    },
  );
});
