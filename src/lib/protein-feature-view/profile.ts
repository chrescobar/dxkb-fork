import type { DataTableColumn } from "@/components/shared/data-table";
import type { ResourceCollectionProfile } from "@/components/views";
import { proteinFeatureFields } from "@/constants/datafields/protein_feature";
import type { DataField } from "@/constants/datafields/types";
import { featureHref } from "@/lib/views/hrefs";
import { proteinFeatureStructuralRql } from "./query";
import type { ProteinFeatureViewRecord } from "./schema";

function tableColumn(definition: DataField): DataTableColumn {
  return {
    id: definition.field,
    label: definition.label,
    visible: !definition.hidden,
    sortable: definition.sortable ?? true,
    fallbackValue:
      definition.field === "patric_id"
        ? function (row) {
            return row.feature_id;
          }
        : undefined,
    valueHref: definition.link,
  };
}

const fields: DataField[] = Object.values(proteinFeatureFields);

export const proteinFeatureColumns = fields
  .filter((field) => field.show_in_table !== false)
  .map(tableColumn);
export const proteinFeatureDetailFields = [
  ...new Set(fields.map((field) => field.field)),
];
export const proteinFeatureFacets = fields
  .filter((field) => field.facet)
  .map((field) => ({
    field: field.field,
    label: field.label,
    initiallyVisible: field.facet_hidden !== true,
  }));

export const proteinFeatureCollectionProfile: ResourceCollectionProfile<ProteinFeatureViewRecord> =
  {
    resource: "protein_feature",
    label: "Domains and Motifs",
    idField: "id",
    columns: proteinFeatureColumns,
    detailFields: proteinFeatureDetailFields,
    defaultSort: "unsorted",
    basePredicate: "eq(id,*)",
    buildStructuralRql: proteinFeatureStructuralRql,
    facets: proteinFeatureFacets,
    guideUrl:
      "https://www.bv-brc.org/docs/quick_references/organisms_taxon/domains_and_motifs.html",
    rowHref: (row) => {
      const featureId = row.feature_id ?? row.patric_id;
      return featureId ? featureHref(featureId) : undefined;
    },
    rowLinkField: "patric_id",
  };
