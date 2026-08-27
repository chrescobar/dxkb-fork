import { genomeSequenceFields } from "@/constants/datafields/genome_sequence";
import { ppiFields } from "@/constants/datafields/ppi";
import type { DataFieldMap } from "@/constants/datafields/types";
import { eq } from "@/lib/data-api";

function tableColumns(fields: DataFieldMap) {
  return Object.values(fields).flatMap((field) =>
    field.show_in_table === false
      ? []
      : [{ id: field.field, label: field.label, visible: !field.hidden }],
  );
}

export const genomeSequenceColumns = tableColumns(genomeSequenceFields);
export const interactionColumns = tableColumns(ppiFields);

export function genomeFeatureRql(
  genomeId: string,
  featureType?: string,
): string {
  const genome = eq("genome_feature", "genome_id", genomeId);
  return featureType
    ? `and(${genome},${eq("genome_feature", "feature_type", featureType)})`
    : genome;
}

export function genomeSequenceRql(genomeId: string): string {
  return eq("genome_sequence", "genome_id", genomeId);
}

export function taxonomySequenceRql(lineageClause: string): string {
  return `and(eq(genome_id,*),genome(and(${lineageClause},ne(genome_status,Deprecated))))`;
}

export function genomeInteractionsRql(genomeId: string): string {
  return `and(${eq("ppi", "genome_id_a", genomeId)},${eq("ppi", "evidence", "experimental")})`;
}

export function taxonomyInteractionsRql(lineageClause: string): string {
  return `and(eq(genome_id_a,*),genome(to(genome_id_a),and(${lineageClause},ne(genome_status,Deprecated))),eq(evidence,experimental))`;
}
