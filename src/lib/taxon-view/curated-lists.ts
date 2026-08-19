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

// Built once at module load from committed defaults. The env override (below)
// can replace any subset of these per call without re-allocating these.
const defaultLists: CuratedLists = {
  sfvtTaxonIds: new Set(sfvtTaxonIds),
  surveillanceLineageNames: new Set(surveillanceSerologyNames),
  serologyLineageNames: new Set(surveillanceSerologyNames),
};

// Build a Set for one curated key: use the env-provided array when it is a real
// array, otherwise fall back to the committed default. Array.isArray rejects both
// an omitted key (undefined) and a present-but-wrong-typed value (e.g. "12637"
// instead of [12637], which new Set would otherwise split into single
// characters) — so a fat-fingered env value never silently breaks gating.
function mergedSet<T>(
  value: readonly T[] | undefined,
  fallback: ReadonlySet<T>,
): ReadonlySet<T> {
  return new Set<T>(Array.isArray(value) ? value : fallback);
}

// Optional production override via TAXON_VIEW_POLICY_JSON. Lets curation data
// change by setting the env var + restart, with no code rebuild. Any omitted
// key falls back to the committed default for that key. Malformed JSON logs the
// original parse error and falls back wholesale — it never throws.
function parseEnvPolicy(): CuratedLists | null {
  const raw = process.env.TAXON_VIEW_POLICY_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      sfvtTaxonIds?: number[];
      surveillanceLineageNames?: string[];
      serologyLineageNames?: string[];
    };
    return {
      sfvtTaxonIds: mergedSet(
        // Array.isArray guard before .map: a non-array value (e.g. scalar
        // "12637") has no .map, so calling it throws and the catch discards
        // ALL valid sibling overrides. Guard first, then coerce string IDs
        // and filter NaN so ["12637"] → Set<number> works correctly.
        Array.isArray(parsed.sfvtTaxonIds)
          ? parsed.sfvtTaxonIds.map(Number).filter((n) => !isNaN(n))
          : undefined,
        defaultLists.sfvtTaxonIds,
      ),
      surveillanceLineageNames: mergedSet(
        parsed.surveillanceLineageNames,
        defaultLists.surveillanceLineageNames,
      ),
      serologyLineageNames: mergedSet(
        parsed.serologyLineageNames,
        defaultLists.serologyLineageNames,
      ),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `taxon-view: TAXON_VIEW_POLICY_JSON is not valid JSON (${message}); using defaults`,
    );
    return null;
  }
}

// ponytail: reads env on every call so vi.resetModules() works in tests; in
// production env vars are stable between requests so this is effectively free.
export function getCuratedLists(): CuratedLists {
  return parseEnvPolicy() ?? defaultLists;
}
