import { shouldSearch } from "../use-genome-typeahead";

describe("shouldSearch", () => {
  it("returns false for empty string", () => {
    expect(shouldSearch("", 0)).toBe(false);
  });

  it("returns false for whitespace-only", () => {
    expect(shouldSearch("   ", 0)).toBe(false);
  });

  it("returns true when trimmed length meets minLength", () => {
    expect(shouldSearch("abc", 3)).toBe(true);
  });

  it("returns false when trimmed length is below minLength", () => {
    expect(shouldSearch("ab", 3)).toBe(false);
  });

  it("allows 0 minLength for non-numeric strings", () => {
    expect(shouldSearch("x", 0)).toBe(true);
  });

  it("requires >= 2 chars for numeric genome IDs regardless of minLength", () => {
    expect(shouldSearch("1", 0)).toBe(false);
    expect(shouldSearch("12", 0)).toBe(true);
    expect(shouldSearch("123.45", 0)).toBe(true);
  });

  it("treats dotted numeric as genome ID pattern", () => {
    expect(shouldSearch("1.1", 0)).toBe(true);
    expect(shouldSearch("1.", 5)).toBe(false); // not matching numeric pattern — treated as text, length 2 < 5
  });
});
