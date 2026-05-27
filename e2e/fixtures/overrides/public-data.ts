import type { JsonOverride } from "../../mocks/backends";

/**
 * Stubs for BV-BRC public-data API calls that service forms make during rerun
 * hydration or while resolving a referenced genome / taxonomy ID (e.g.
 * `SingleGenomeSelector` for similar-genome-finder, genome-alignment's
 * `fetchGenomesByIds` rehydration, BLAST DB pickers).
 *
 * The internal `/api/services/genome/by-ids` route proxies to the BV-BRC
 * data-api; `/api/services/genome/search` does the same for typeahead.
 * Stubbing at the internal-route level (not the upstream data-api URL)
 * keeps these tests independent of `NEXT_PUBLIC_DATA_API` routing.
 *
 * Add a stub here when a service tutorial walkthrough spec needs it, rather
 * than pre-populating with every possible data-api endpoint. This keeps
 * strict mode honest — unmocked data-api calls surface as failures.
 */
export const publicDataOverrides: JsonOverride[] = [
  // genome-alignment's rerun onApply calls fetchGenomesByIds to rehydrate
  // the selected genome list. Return a fixed pair so the schema's "at least
  // 2 genomes" rule is satisfied for rerun-only walkthroughs.
  {
    url: "/api/services/genome/by-ids",
    method: "POST",
    body: ({ parsedBody }) => {
      const ids =
        ((parsedBody as { genome_ids?: string[] } | null)?.genome_ids ?? []) as string[];
      return {
        results: ids.map((id) => ({
          genome_id: id,
          genome_name: `Mock genome ${id}`,
          public: true,
        })),
      };
    },
  },
  // SingleGenomeSelector typeahead hits `/api/services/genome/search` while
  // the dropdown is closed (preloaded suggestions). Returns an empty list so
  // the selector mounts cleanly — none of the tutorial walkthrough specs
  // need typeahead results, they pre-populate via `selectedGenomeId` /
  // `reference_genome_id` rerun fields instead.
  {
    url: /\/api\/services\/genome\/search(?:\?|$)/,
    method: "GET",
    body: { results: [], total: 0 },
  },
  // genome-annotation's rerun onApply (via applyTaxonomyIdWithLookup) hits
  // `/api/services/taxonomy?q=taxon_id:<id>&fl=taxon_id,taxon_name` to resolve
  // the scientific name for the rerun-provided taxonomy_id. Returns a fixed
  // payload — `fetchTaxonNameById` parses the first doc's `taxon_name` and
  // copies it into the form's `scientific_name` field. The actual id/name
  // doesn't have to match the request: the form's submit-time JSON keeps
  // whatever the user originally provided (the lookup only fills the display
  // name asynchronously). Matches the BV-BRC data-api `select()` shape.
  {
    url: /\/api\/services\/taxonomy(?:\?|$)/,
    method: "GET",
    body: [
      { taxon_id: 83332, taxon_name: "Mycobacterium tuberculosis H37Rv" },
    ],
  },
  // viral-assembly's SraRunAccessionWithValidation component fires a
  // GET to `/api/services/sra-validation?accession=<id>` as soon as a
  // valid-shaped SRR is hydrated by rerun. The route proxies to NCBI for an
  // XML response which the UI doesn't actually parse — only the `success`
  // flag matters for clearing the validating spinner.
  {
    url: /\/api\/services\/sra-validation(?:\?|$)/,
    method: "GET",
    body: { success: true, xml: "<eSearchResult><Count>1</Count></eSearchResult>" },
  },
];
