import type { DataFieldMap } from "./types";

// Sequence Feature Variant Types (SFVT). The endpoint has no taxon field, so
// the taxon-view scopes it with a keyword() prefix on sf_id (see the SFVT view
// factory). These columns drive the ListData table on the taxon SFVT tab.
export const sequenceFeatureVtFields = {
  sf_id: {
    label: "SF ID",
    field: "sf_id",
    hidden: false,
    group: "Sequence Feature",
    facet: false,
    facet_hidden: true,
    search: true,
  },
  sf_name: {
    label: "SF Name",
    field: "sf_name",
    hidden: false,
    group: "Sequence Feature",
    facet: false,
    facet_hidden: true,
    search: true,
  },
  sf_category: {
    label: "Category",
    field: "sf_category",
    hidden: false,
    group: "Sequence Feature",
    facet: true,
    facet_hidden: false,
    search: true,
  },
  sfvt_id: {
    label: "Variant Type ID",
    field: "sfvt_id",
    hidden: false,
    group: "Variant Type",
    facet: false,
    facet_hidden: true,
    search: true,
  },
  sfvt_variations: {
    label: "Variations",
    field: "sfvt_variations",
    hidden: false,
    group: "Variant Type",
    facet: false,
    facet_hidden: true,
    search: false,
  },
  sfvt_genome_count: {
    label: "Genome Count",
    field: "sfvt_genome_count",
    hidden: false,
    group: "Variant Type",
    facet: false,
    facet_hidden: true,
    search: false,
  },
  sf_sequence: {
    label: "SF Sequence",
    field: "sf_sequence",
    hidden: true,
    group: "Sequence",
    facet: false,
    facet_hidden: true,
    search: false,
  },
  sfvt_sequence: {
    label: "Variant Sequence",
    field: "sfvt_sequence",
    hidden: true,
    group: "Sequence",
    facet: false,
    facet_hidden: true,
    search: false,
  },
} satisfies DataFieldMap;
