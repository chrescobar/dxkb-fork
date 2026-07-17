import { getCuratedLists } from "@/lib/taxon-view/curated-lists";

import { resolveSfvtTaxonId, sfvtTaxonIdRemap } from "../sfvt";

// SFVT scopes the sequence_feature core via eq(taxon_id,…). The page taxon is
// remapped to the curated species id where features actually live (a
// hand-maintained map). The gate (hasSfvt) enables the tab from a SEPARATE list
// (getCuratedLists().sfvtTaxonIds). If a taxon is added to that list without an
// entry here, the tab enables but renders nothing. These tests fail on that drift.
describe("sfvt taxon-id remap", () => {
  it("covers every curated SFVT taxon", () => {
    const { sfvtTaxonIds } = getCuratedLists();
    for (const id of sfvtTaxonIds) {
      expect(resolveSfvtTaxonId([id])).not.toBeNull();
    }
  });

  it("resolves a taxon via any ancestor in its lineage", () => {
    const [curatedId] = Object.keys(sfvtTaxonIdRemap).map(Number);
    // A sub-taxon (leaf 999 not in the map) resolves through its curated ancestor.
    expect(resolveSfvtTaxonId([999, curatedId])).toBe(
      sfvtTaxonIdRemap[curatedId],
    );
  });

  it("remaps the Influenza A landing taxon to the species id", () => {
    expect(resolveSfvtTaxonId([2955291])).toBe(11320);
  });

  it("returns null when no lineage id is curated", () => {
    expect(resolveSfvtTaxonId([1, 2, 999])).toBeNull();
  });
});
