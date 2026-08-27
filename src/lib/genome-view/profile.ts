import type { DataTableColumn } from "@/components/shared/data-table";
import type { ResourceCollectionProfile } from "@/components/views";
import { genomeFields } from "@/constants/datafields/genome";
import type { DataField } from "@/constants/datafields/types";
import { genomeStructuralRql } from "./query";
import type { GenomeViewRecord } from "./schema";

function tableColumn(definition: DataField): DataTableColumn {
  return {
    id: definition.field,
    label: definition.label,
    visible: !definition.hidden,
    sortable: definition.sortable ?? true,
  };
}

const fields: DataField[] = Object.values(genomeFields);

export const genomeColumns: readonly DataTableColumn[] = fields
  .filter((field) => field.show_in_table !== false)
  .map(tableColumn);

export const genomeDetailFields = fields.map((field) => field.field);

export const genomeFacets = fields
  .filter((field) => field.facet)
  .map((field) => ({
    field: field.field,
    label: field.label,
    initiallyVisible: field.facet_hidden !== true,
  }));

export const genomeCollectionProfile: ResourceCollectionProfile<GenomeViewRecord> =
  {
    resource: "genome",
    label: "Genomes",
    idField: "genome_id",
    columns: genomeColumns,
    detailFields: genomeDetailFields,
    defaultSort: "genome_name:asc",
    guideUrl:
      "https://www.bv-brc.org/docs/quick_references/organisms_taxon/genomes.html",
    buildStructuralRql: genomeStructuralRql,
    facets: genomeFacets,
    rowHref: (row) =>
      row.genome_id
        ? `/genome/${encodeURIComponent(row.genome_id)}`
        : undefined,
    rowLinkField: "genome_name",
  };
