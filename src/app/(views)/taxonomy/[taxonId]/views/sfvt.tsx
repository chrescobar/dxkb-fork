import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import { TaxonDataPanel } from "../_components/taxon-data-panel";

// SFVT reads the `sequence_feature` core, which has a taxon_id field, and scopes
// with eq(taxon_id,…) — same as legacy SFVTGrid. Features are stored only at the
// curated species taxon_id (sub-species/strain leaves have zero rows), so a page
// taxon must resolve to its curated species id. Most pages map to themselves;
// the Influenza A landing taxon (2955291) has no features and remaps to the
// species 11320 (legacy does the same remap).
//
// Paired with the curated SFVT taxon IDs in
// `src/lib/taxon-view/curated-lists.ts` (`sfvtTaxonIds`) — the same IDs the
// `hasSfvt` gate enables the tab for. Keep the two in sync: a taxon added to
// sfvtTaxonIds without an entry here enables the tab but renders nothing.
// Verified counts (2026-07-17) via eq(taxon_id,<mapped>): Dengue 7630,
// Monkeypox 1781, Influenza A 5696.
export const sfvtTaxonIdRemap: Record<number, number> = {
  12637: 12637, // Dengue virus
  10244: 10244, // Monkeypox virus
  2955291: 11320, // Alphainfluenzavirus influenzae → Influenza A virus species
};

// Match against the full lineage (not just taxonId) so a species/strain under a
// curated taxon resolves to its ancestor's mapped id — mirrors how `hasSfvt`
// gates on lineageIds. First lineage hit wins.
export function resolveSfvtTaxonId(lineageIds: readonly number[]): number | null {
  for (const id of lineageIds) {
    if (id in sfvtTaxonIdRemap) return sfvtTaxonIdRemap[id];
  }
  return null;
}

export function makeSfvtView({ taxon }: { taxon: OrganismTaxonomy | null }) {
  function SfvtView() {
    if (!taxon) return null;
    const taxonId = resolveSfvtTaxonId(taxon.lineageIds);
    // Tab is gated by hasSfvt, so this is normally non-null. Guard keeps the tab
    // from silently rendering the entire sequence_feature resource if the gate
    // and this map ever drift.
    if (taxonId === null) return null;
    return (
      <TaxonDataPanel
        resource="sequence_feature"
        q={`eq(taxon_id,${String(taxonId)})`}
      />
    );
  }
  return SfvtView;
}
