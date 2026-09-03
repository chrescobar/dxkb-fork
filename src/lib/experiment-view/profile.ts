import type { DataTableColumn } from "@/components/shared/data-table";
import type { ResourceCollectionProfile } from "@/components/views/resource-collection";
import { biosetFields } from "@/constants/datafields/bioset";
import { experimentFields } from "@/constants/datafields/experiment";
import type { DataField } from "@/constants/datafields/types";
import { experimentHref } from "@/lib/views/hrefs";
import { experimentStructuralRql } from "./query";
import type { ExperimentViewRecord } from "./schema";

function tableColumn(definition: DataField): DataTableColumn {
  return {
    id: definition.field,
    label: definition.label,
    visible: !definition.hidden,
    sortable: definition.sortable ?? true,
  };
}

const fields: DataField[] = Object.values(experimentFields);
const childFields: DataField[] = Object.values(biosetFields);

export const experimentColumns = fields
  .filter((field) => field.show_in_table !== false)
  .map(tableColumn);
export const experimentDetailFields = fields.map((field) => field.field);
export const experimentFacets = fields
  .filter((field) => field.facet && field.facet_hidden !== true)
  .map((field) => ({
    field: field.field,
    label: field.label,
    initiallyVisible: true,
  }));

export const biosetColumns = childFields
  .filter((field) => field.show_in_table !== false)
  .map(tableColumn);
export const biosetDetailFields = childFields.map((field) => field.field);
export const biosetFacets = childFields
  .filter((field) => field.facet && field.facet_hidden !== true)
  .map((field) => ({
    field: field.field,
    label: field.label,
    initiallyVisible: true,
  }));

export const experimentCollectionProfile: ResourceCollectionProfile<ExperimentViewRecord> = {
  resource: "experiment",
  label: "Experiments",
  idField: "exp_id",
  columns: experimentColumns,
  detailFields: experimentDetailFields,
  defaultSort: "unsorted",
  basePredicate: "eq(exp_id,*)",
  guideUrl: "https://www.bv-brc.org/docs/quick_references/organisms_taxon/experiments.html",
  buildStructuralRql: experimentStructuralRql,
  facets: experimentFacets,
  rowHref: (row) => experimentHref(row.exp_id),
  rowLinkField: "exp_id",
};

export const biosetCollectionProfile: ResourceCollectionProfile<Record<string, unknown>> = {
  resource: "bioset",
  label: "Biosets",
  idField: "bioset_id",
  columns: biosetColumns,
  detailFields: biosetDetailFields,
  defaultSort: "bioset_id:asc",
  basePredicate: "eq(bioset_id,*)",
  guideUrl: "https://www.bv-brc.org/docs/quick_references/organisms_taxon/experiments.html",
  facets: biosetFacets,
};
