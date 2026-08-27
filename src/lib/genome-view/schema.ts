import { z } from "zod";

const scalar = z.union([z.string(), z.number()]);
const stringList = z.union([z.string(), z.array(z.string())]);

export const genomeViewRecordSchema = z.looseObject({
  genome_id: z.string().regex(/^\d+\.\d+$/),
  genome_name: z.string().optional(),
  strain: z.string().optional(),
  taxon_id: scalar.optional(),
  taxon_lineage_ids: z.union([scalar, z.array(scalar)]).optional(),
  taxon_lineage_names: stringList.optional(),
  superkingdom: z.string().optional(),
  genome_status: z.string().optional(),
  genome_quality: z.string().optional(),
  genome_quality_flags: stringList.optional(),
  genome_length: scalar.optional(),
  contigs: scalar.optional(),
  chromosomes: scalar.optional(),
  plasmids: scalar.optional(),
  gc_content: scalar.optional(),
  cds: scalar.optional(),
  patric_cds: scalar.optional(),
  trna: scalar.optional(),
  rrna: scalar.optional(),
  mat_peptide: scalar.optional(),
  checkm_completeness: scalar.optional(),
  checkm_contamination: scalar.optional(),
  assembly_accession: z.string().optional(),
  genbank_accessions: stringList.optional(),
  collection_date: z.string().optional(),
  collection_year: scalar.optional(),
  isolation_country: z.string().optional(),
  host_common_name: z.string().optional(),
  host_name: z.string().optional(),
});

export type GenomeViewRecord = z.infer<typeof genomeViewRecordSchema>;

export function isGenomeId(value: string): boolean {
  return /^\d+\.\d+$/.test(value);
}
