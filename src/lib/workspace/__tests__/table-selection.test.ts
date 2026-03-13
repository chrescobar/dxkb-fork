import type { WorkspaceBrowserItem } from "@/types/workspace-browser";
import { normalizePath, computeNextSelection } from "../table-selection";

const makeItem = (path: string) => ({ path }) as WorkspaceBrowserItem;

describe("normalizePath", () => {
  it("collapses consecutive slashes", () => {
    expect(normalizePath("a///b//c")).toBe("a/b/c");
  });

  it("strips a leading slash", () => {
    expect(normalizePath("/foo/bar")).toBe("foo/bar");
  });

  it("strips a trailing slash", () => {
    expect(normalizePath("foo/bar/")).toBe("foo/bar");
  });

  it("strips both leading and trailing slashes and collapses multiples", () => {
    expect(normalizePath("///foo///bar///")).toBe("foo/bar");
  });

  it('returns "/" for undefined', () => {
    expect(normalizePath(undefined)).toBe("/");
  });

  it('returns "/" for an empty string', () => {
    expect(normalizePath("")).toBe("/");
  });
});

describe("computeNextSelection", () => {
  const items = [makeItem("/a"), makeItem("/b"), makeItem("/c"), makeItem("/d")];
  const noMod = { ctrlOrMeta: false, shift: false };

  describe("plain click (no modifiers)", () => {
    it("replaces the current selection with the clicked item", () => {
      const existing = [items[0], items[1]];
      const result = computeNextSelection(items, existing, "a", items[2], noMod);

      expect(result.nextSelection).toEqual([items[2]]);
    });

    it("sets the anchor to the clicked item path", () => {
      const result = computeNextSelection(items, [], null, items[1], noMod);

      expect(result.nextAnchorPath).toBe(normalizePath(items[1].path));
    });
  });

  describe("ctrl/meta click", () => {
    const ctrlMod = { ctrlOrMeta: true, shift: false };

    it("adds the clicked item when it is not already selected", () => {
      const current = [items[0]];
      const result = computeNextSelection(items, current, "a", items[2], ctrlMod);

      expect(result.nextSelection).toEqual([items[0], items[2]]);
    });

    it("removes the clicked item when it is already selected", () => {
      const current = [items[0], items[1], items[2]];
      const result = computeNextSelection(items, current, "a", items[1], ctrlMod);

      expect(result.nextSelection).toEqual([items[0], items[2]]);
    });

    it("preserves the existing anchor", () => {
      const result = computeNextSelection(items, [items[0]], "a", items[2], ctrlMod);

      expect(result.nextAnchorPath).toBe("a");
    });

    it("sets the anchor to clicked path when anchor is null", () => {
      const result = computeNextSelection(items, [items[0]], null, items[2], ctrlMod);

      expect(result.nextAnchorPath).toBe(normalizePath(items[2].path));
    });
  });

  describe("shift click (range select)", () => {
    const shiftMod = { ctrlOrMeta: false, shift: true };

    it("selects the range from anchor to clicked item (forward)", () => {
      const anchorPath = normalizePath(items[0].path);
      const result = computeNextSelection(items, [], anchorPath, items[2], shiftMod);

      expect(result.nextSelection).toEqual([items[0], items[1], items[2]]);
    });

    it("selects the range from anchor to clicked item (backward)", () => {
      const anchorPath = normalizePath(items[3].path);
      const result = computeNextSelection(items, [], anchorPath, items[1], shiftMod);

      expect(result.nextSelection).toEqual([items[1], items[2], items[3]]);
    });

    it("preserves the existing anchor", () => {
      const anchorPath = normalizePath(items[0].path);
      const result = computeNextSelection(items, [], anchorPath, items[2], shiftMod);

      expect(result.nextAnchorPath).toBe(anchorPath);
    });

    it("falls back to single select when anchor is not found in orderedItems", () => {
      const result = computeNextSelection(items, [], "nonexistent", items[2], shiftMod);

      expect(result.nextSelection).toEqual([items[2]]);
      expect(result.nextAnchorPath).toBe(normalizePath(items[2].path));
    });

    it("falls back to single select when anchor is null", () => {
      const result = computeNextSelection(items, [], null, items[1], shiftMod);

      expect(result.nextSelection).toEqual([items[1]]);
      expect(result.nextAnchorPath).toBe(normalizePath(items[1].path));
    });
  });
});
