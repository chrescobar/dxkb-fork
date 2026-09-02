import type { DataTableColumn } from "@/components/shared/data-table";
import type { ResourceCollectionProfile } from "@/components/views";
import { strainFields } from "@/constants/datafields/strain";
import type { DataField } from "@/constants/datafields/types";
import { strainStructuralRql } from "./query";
import type { StrainViewRecord } from "./schema";

const accessionFields = new Set([
  "genbank_accessions",
  "1_pb2",
  "2_pb1",
  "3_pa",
  "4_ha",
  "5_np",
  "6_na",
  "7_mp",
  "8_ns",
  "s",
  "m",
  "l",
  "other_segments",
]);
const multipleFields = new Set(["genome_ids", ...accessionFields]);

function tableColumn(definition: DataField): DataTableColumn {
  return {
    id: definition.field,
    label: definition.label,
    visible: !definition.hidden,
    sortable: multipleFields.has(definition.field)
      ? false
      : (definition.sortable ?? true),
    valueHref:
      definition.link ??
      (accessionFields.has(definition.field)
        ? "https://www.ncbi.nlm.nih.gov/nuccore/{value}"
        : undefined),
  };
}

const fields: DataField[] = Object.values(strainFields);

export const strainColumns = fields
  .filter((field) => field.show_in_table !== false)
  .map(tableColumn);
export const strainDetailFields = fields.map((field) => field.field);
export const strainFacets = fields
  .filter((field) => field.facet)
  .map((field) => ({
    field: field.field,
    label: field.label,
    initiallyVisible: field.facet_hidden !== true,
  }));

export const strainCollectionProfile: ResourceCollectionProfile<StrainViewRecord> =
  {
    resource: "strain",
    label: "Strains",
    idField: "id",
    columns: strainColumns,
    detailFields: strainDetailFields,
    defaultSort: "unsorted",
    basePredicate: "eq(id,*)",
    buildStructuralRql: strainStructuralRql,
    facets: strainFacets,
    guideUrl:
      "https://www.bv-brc.org/docs/quick_references/organisms_taxon/strains.html",
  };
