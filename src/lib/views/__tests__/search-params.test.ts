import { firstSearchParam } from "../search-params";

describe("firstSearchParam", () => {
  it("returns a scalar value as-is", () => {
    expect(firstSearchParam({ tab: "overview" }, "tab")).toBe("overview");
  });
  it("returns the first element of an array value", () => {
    expect(firstSearchParam({ tab: ["a", "b"] }, "tab")).toBe("a");
  });
  it("returns undefined for a missing key", () => {
    expect(firstSearchParam({ other: "x" }, "tab")).toBeUndefined();
  });
  it("returns undefined when params is undefined", () => {
    expect(firstSearchParam(undefined, "tab")).toBeUndefined();
  });
  it("returns undefined for an empty array value", () => {
    expect(firstSearchParam({ tab: [] }, "tab")).toBeUndefined();
  });
});
