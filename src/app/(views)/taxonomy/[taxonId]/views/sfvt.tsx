import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import { TaxonDataPanel } from "../_components/taxon-data-panel";

// SFVT reads the `sequence_feature` core, which has a taxon_id field, and scopes
// with eq(taxon_id,…) — same as legacy SFVTGrid. Features are stored only at the
// curated species taxon_id (sub-species/strain leaves have zero rows), so a page
// taxon must resolve to its curated species id.
//
// Most curated taxa map to themselves — those come from `sfvtTaxonIds` in
// getCuratedLists() automatically. Only add an entry to `sfvtTaxonIdRemap` when
// the landing taxon id differs from the species id where features are stored.
// Verified counts (2026-07-17) via eq(taxon_id,<mapped>): Dengue 7630,
// Monkeypox 1781, Influenza A 5696.
export const sfvtTaxonIdRemap: Record<number, number> = {
  2955291: 11320, // Alphainfluenzavirus influenzae → Influenza A virus species
};

// Match against the full lineage (not just taxonId) so a species/strain under a
// curated taxon resolves to its ancestor's mapped id — mirrors how `hasSfvt`
// gates on lineageIds. Explicit remap wins; otherwise any curated id self-maps.
// First lineage hit wins.
export function resolveSfvtTaxonId(
  lineageIds: readonly number[],
  sfvtTaxonIds: ReadonlySet<number>,
): number | null {
  for (const id of lineageIds) {
    if (id in sfvtTaxonIdRemap) return sfvtTaxonIdRemap[id];
    if (sfvtTaxonIds.has(id)) return id;
  }
  return null;
}

export function makeSfvtView({
  taxon,
  sfvtTaxonIds,
}: {
  taxon: OrganismTaxonomy | null;
  sfvtTaxonIds: ReadonlySet<number>;
}) {
  function SfvtView() {
    if (!taxon) return null;
    const taxonId = resolveSfvtTaxonId(taxon.lineageIds, sfvtTaxonIds);
    // Tab is gated by hasSfvt, so this is normally non-null. Guard prevents
    // rendering the entire sequence_feature resource if gate and map drift.
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
