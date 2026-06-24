/**
 * Curated cohort lists for taxon-view tab gating (source doc §4.3/§4.4, §7.4).
 *
 * These are PRODUCT data, not logic: they change on a curation cadence, not a
 * release cadence. They live here as a committed config behind getCuratedLists()
 * so a future swap to a `/api/taxon-view/tab-policy` endpoint touches only that
 * function — the predicates never change.
 *
 * NOTE: the values below are seeded from the doc's observed behavior and are
 * placeholders pending the authoritative curation source. The gates are correct
 * regardless of list contents; only coverage changes when the real lists land.
 */
export interface CuratedLists {
  sfvtTaxonIds: ReadonlySet<number>;
  surveillanceLineageNames: ReadonlySet<string>;
  serologyLineageNames: ReadonlySet<string>;
}

// Surveillance & Serology share the same curated pathogen cohort (doc §4.3).
const surveillanceSerologyNames: readonly string[] = [
  "Alphainfluenzavirus influenzae",
  "Rhinovirus A",
];

// Taxa observed with an SFVT tab in the doc §5 truth table. Placeholder until
// the authoritative SFVT curation list is wired through the policy API.
const sfvtTaxonIds: readonly number[] = [
  12637, // Dengue virus
  10244, // Monkeypox virus
  2955291, // Alphainfluenzavirus influenzae
];

export function getCuratedLists(): CuratedLists {
  return {
    sfvtTaxonIds: new Set(sfvtTaxonIds),
    surveillanceLineageNames: new Set(surveillanceSerologyNames),
    serologyLineageNames: new Set(surveillanceSerologyNames),
  };
}
