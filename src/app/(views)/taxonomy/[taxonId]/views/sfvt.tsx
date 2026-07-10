import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import { TaxonDataPanel } from "../_components/taxon-data-panel";

// SFVT (sequence_feature_vt) has NO taxon_id / taxon_lineage_ids field — every
// eq(taxon*,…) returns HTTP 400. The taxon is only embedded as a prefix inside
// sf_id (e.g. "Dengue virus 1_ancC_SF1", "Influenza A_PA_SF510"), so the only
// way to scope by taxon is a keyword() full-text match on that prefix.
//
// These terms are paired with the curated SFVT taxon IDs in
// `src/lib/taxon-view/curated-lists.ts` (`sfvtTaxonIds`) — the same IDs the
// `hasSfvt` gate enables the tab for. Keep the two in sync: a taxon added to
// sfvtTaxonIds without a term here enables the tab but renders nothing.
// Verified keyword counts (2026-06-26): Dengue 145412, Monkeypox 16281,
// Influenza A 2000036 — each equals the exact eq(sf_id,<term>*) prefix count.
export const sfvtKeywordByTaxonId: Record<number, string> = {
  12637: "Dengue", // Dengue virus
  10244: "Monkeypox", // Monkeypox virus
  2955291: "Influenza A", // Alphainfluenzavirus influenzae
};

// Match against the full lineage (not just taxonId) so a species/strain under a
// curated taxon resolves to its ancestor's term — mirrors how `hasSfvt` gates on
// lineageIds. First lineage hit wins.
export function resolveSfvtKeyword(lineageIds: readonly number[]): string | null {
  for (const id of lineageIds) {
    const term = sfvtKeywordByTaxonId[id];
    if (term) return term;
  }
  return null;
}

export function makeSfvtView({ taxon }: { taxon: OrganismTaxonomy | null }) {
  function SfvtView() {
    if (!taxon) return null;
    const term = resolveSfvtKeyword(taxon.lineageIds);
    // Tab is gated by hasSfvt, so this is normally non-null. Guard keeps the
    // tab from silently rendering the entire 2.2M-row resource if the gate and
    // this map ever drift.
    if (!term) return null;
    return (
      <TaxonDataPanel
        resource="sequence_feature_vt"
        q={`keyword(${encodeURIComponent(term)})`}
      />
    );
  }
  return SfvtView;
}
