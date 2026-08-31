import type { DataTableColumn } from "@/components/shared/data-table";
import type { ResourceCollectionProfile } from "@/components/views";
import { epitopeFields } from "@/constants/datafields/epitope";
import { epitopeAssayFields } from "@/constants/datafields/epitope_assay";
import type { DataField } from "@/constants/datafields/types";
import { epitopeHref } from "@/lib/views/hrefs";
import { epitopeStructuralRql } from "./query";
import type { EpitopeViewRecord } from "./schema";

function tableColumn(definition: DataField): DataTableColumn {
  return {
    id: definition.field,
    label: definition.label,
    visible: !definition.hidden,
    sortable: definition.sortable ?? true,
  };
}

const fields: DataField[] = Object.values(epitopeFields);
const assayFields: DataField[] = Object.values(epitopeAssayFields);

export const epitopeColumns = fields
  .filter((field) => field.show_in_table !== false)
  .map(tableColumn);
export const epitopeDetailFields = fields.map((field) => field.field);
export const epitopeFacets = fields
  .filter((field) => field.facet && field.facet_hidden !== true)
  .map((field) => ({ field: field.field, label: field.label, initiallyVisible: true }));

export const epitopeAssayColumns = assayFields.map(tableColumn);

export const epitopeCollectionProfile: ResourceCollectionProfile<EpitopeViewRecord> = {
  resource: "epitope",
  label: "Epitopes",
  idField: "epitope_id",
  columns: epitopeColumns,
  detailFields: epitopeDetailFields,
  defaultSort: "epitope_id:asc",
  basePredicate: "eq(epitope_id,*)",
  guideUrl: "https://www.bv-brc.org/docs/quick_references/organisms_taxon/epitopes.html",
  buildStructuralRql: epitopeStructuralRql,
  facets: epitopeFacets,
  rowHref: (row) => epitopeHref(row.epitope_id),
  rowLinkField: "epitope_id",
};
