import { getCuratedLists } from "@/lib/taxon-view/curated-lists";

import { resolveSfvtKeyword, sfvtKeywordByTaxonId } from "../sfvt";

// SFVT has no taxon field, so the view scopes via a hand-maintained
// taxonId→keyword map. The gate (hasSfvt) enables the tab from a SEPARATE list
// (getCuratedLists().sfvtTaxonIds). If a taxon is added to that list without a
// term here, the tab enables but renders nothing. These tests fail on that drift.
describe("sfvt keyword map", () => {
  it("covers every curated SFVT taxon", () => {
    const { sfvtTaxonIds } = getCuratedLists();
    for (const id of sfvtTaxonIds) {
      expect(resolveSfvtKeyword([id])).not.toBeNull();
    }
  });

  it("resolves a taxon via any ancestor in its lineage", () => {
    const [curatedId] = Object.keys(sfvtKeywordByTaxonId).map(Number);
    // A sub-taxon (leaf 999 not in the map) resolves through its curated ancestor.
    expect(resolveSfvtKeyword([999, curatedId])).toBe(
      sfvtKeywordByTaxonId[curatedId],
    );
  });

  it("returns null when no lineage id is curated", () => {
    expect(resolveSfvtKeyword([1, 2, 999])).toBeNull();
  });
});
