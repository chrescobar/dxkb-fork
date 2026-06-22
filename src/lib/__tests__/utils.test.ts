import { cn, noop, getFirstDefined } from "@/lib/utils";

describe("cn", () => {
  it("combines multiple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("merges conflicting tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional classes", () => {
    const condition = false as boolean;
    expect(cn("base", condition && "hidden", "extra")).toBe("base extra");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });
});

describe("noop", () => {
  it("is a function", () => {
    expect(typeof noop).toBe("function");
  });

  it("returns undefined", () => {
    // noop's declared return type is void; calling it as a standalone statement
    // verifies it executes without throwing. The void return type is checked by TS.
    noop();
  });
});

describe("getFirstDefined", () => {
  it("returns the first non-null/undefined value", () => {
    const obj = { a: undefined, b: null, c: "found" };
    expect(getFirstDefined(obj, "a", "b", "c")).toBe("found");
  });

  it("returns undefined when no match exists", () => {
    const obj = { a: undefined, b: null };
    expect(getFirstDefined(obj, "a", "b", "missing")).toBeUndefined();
  });

  it("skips null values", () => {
    const obj = { a: null, b: 42 };
    expect(getFirstDefined(obj, "a", "b")).toBe(42);
  });

  it("skips undefined values", () => {
    const obj = { a: undefined, b: "yes" };
    expect(getFirstDefined(obj, "a", "b")).toBe("yes");
  });

  it("returns the first key if it has a value", () => {
    const obj = { a: "first", b: "second" };
    expect(getFirstDefined(obj, "a", "b")).toBe("first");
  });

  it("returns 0 and false as valid values", () => {
    const obj = { a: 0, b: false };
    expect(getFirstDefined(obj, "a")).toBe(0);
    expect(getFirstDefined(obj, "b")).toBe(false);
  });
});
