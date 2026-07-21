export const resourceIdField: Record<string, string> = {
  genome: "genome_id",
  genome_sequence: "sequence_id",
  genome_feature: "patric_id",
  protein_feature: "id",
  genome_amr: "id",
  strain: "strain",
  epitope: "epitope_id",
  protein_structure: "pdb_id",
  taxonomy: "taxon_id",
  experiment: "exp_id",
  bioset: "bioset_id",
  surveillance: "id",
  serology: "id",
  sequence_feature: "id",
  ppi: "id",
};

export function getIdField(resource: string): string {
  return resourceIdField[resource] ?? "id";
}
