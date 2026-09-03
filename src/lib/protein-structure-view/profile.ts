import type { DataTableColumn } from "@/components/shared/data-table";
import type { ResourceCollectionProfile } from "@/components/views/resource-collection";
import { proteinStructureFields } from "@/constants/datafields/protein_structure";
import type { DataField } from "@/constants/datafields/types";
import { resourceRegistry } from "@/lib/data-api";
import { proteinStructureHref } from "@/lib/views/hrefs";
import { proteinStructureStructuralRql } from "./query";
import type { ProteinStructureViewRecord } from "./schema";

const unsafeProjectionFields = new Set(["sequence", "alignments"]);
const fields: DataField[] = Object.values(proteinStructureFields).filter(
  (field) => !unsafeProjectionFields.has(field.field),
);
const resourceFields = resourceRegistry.protein_structure.fields;

function tableColumn(definition: DataField): DataTableColumn {
  return {
    id: definition.field,
    label: definition.label,
    visible: !definition.hidden,
    sortable: resourceFields[definition.field].sortable,
    valueHref: definition.field === "pdb_id" ? undefined : definition.link,
  };
}

export const proteinStructureColumns = fields
  .filter((field) => field.show_in_table !== false)
  .map(tableColumn);
export const proteinStructureDetailFields = fields.map((field) => field.field);
export const proteinStructureFacets = fields
  .filter((field) => field.facet)
  .map((field) => ({
    field: field.field,
    label: field.label,
    initiallyVisible: field.facet_hidden !== true,
  }));

export const proteinStructureCollectionProfile: ResourceCollectionProfile<ProteinStructureViewRecord> =
  {
    resource: "protein_structure",
    label: "Protein Structures",
    idField: "pdb_id",
    columns: proteinStructureColumns,
    detailFields: proteinStructureDetailFields,
    defaultSort: "unsorted",
    basePredicate: "eq(pdb_id,*)",
    buildStructuralRql: proteinStructureStructuralRql,
    facets: proteinStructureFacets,
    guideUrl:
      "https://www.bv-brc.org/docs/quick_references/organisms_taxon/protein_structures.html",
    rowHref: (row) => proteinStructureHref(row.pdb_id),
    rowLinkField: "pdb_id",
  };
