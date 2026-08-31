import type { DataTableColumn } from "@/components/shared/data-table";
import type { ResourceCollectionProfile } from "@/components/views";
import { genomeFeatureFields } from "@/constants/datafields/genome_feature";
import type { DataField } from "@/constants/datafields/types";
import { featureHref } from "@/lib/views/hrefs";
import { featureStructuralRql } from "./query";
import type { FeatureViewRecord } from "./schema";

function tableColumn(definition: DataField): DataTableColumn {
  return {
    id: definition.field,
    label: definition.label,
    visible: !definition.hidden,
    sortable: definition.sortable ?? true,
  };
}

const fields: DataField[] = Object.values(genomeFeatureFields);

export const featureColumns: readonly DataTableColumn[] = fields
  .filter((field) => field.show_in_table !== false && !field.hidden)
  .map(tableColumn);

export const featureDetailFields = fields.map((field) => field.field);

// High-cardinality hidden facets (product, gene, families, GO) make the upstream
// combined query time out. Fetch the established visible facets only.
export const featureFacets = fields
  .filter((field) => field.facet && field.facet_hidden !== true)
  .map((field) => ({
    field: field.field,
    label: field.label,
    initiallyVisible: field.facet_hidden !== true,
  }));

export const featureCollectionProfile: ResourceCollectionProfile<FeatureViewRecord> = {
  resource: "genome_feature",
  label: "Features",
  idField: "feature_id",
  columns: featureColumns,
  detailFields: featureDetailFields,
  defaultSort: "patric_id:asc",
  guideUrl: "https://www.bv-brc.org/docs/quick_references/organisms_taxon/features.html",
  buildStructuralRql: featureStructuralRql,
  facets: featureFacets,
  rowHref: (row) => row.feature_id ? featureHref(row.feature_id) : undefined,
  rowLinkField: "patric_id",
};
